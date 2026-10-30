import "server-only";
import { createHash } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { manualSearchResults, manualSearchSnapshots, manualSearchUsage, searchRequestLimits, vendorsTable, packagesTable } from "@/db/schema";
import { findVendorsByPreferences } from "@/db/queries/vendors";
import { manualSearchLimit, searchDay, SEARCH } from "@/config/plans";
import type { AccountAccess } from "@/types/accountAccess";
import type { VendorAndPackagesMatchDTOType, VendorMatchDTOType } from "@/types/dtoTypes";
import type { SearchUsage, SnapshotMatch } from "@/types/search";
import { RequestError } from "./requestValidation";
import { projectVendorMatches } from "./vendorResponseService";
import { getVendorImageUrls } from "./vendorImageService";

function usageFor(access: AccountAccess, used: number, resetsAt: string): SearchUsage {
  const limit = manualSearchLimit(access);
  return { used, limit, remaining: limit === null ? null : Math.max(0, limit - used), resetsAt };
}

function validateSearch(access: AccountAccess, searchId: string) {
  if (!access.userId) throw new RequestError("Sign in to search", 401);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(searchId)) {
    throw new RequestError("A valid search ID is required");
  }
  return access.userId;
}

// Shared database state makes limits consistent across tabs and server instances.
export async function throttleSearch(userId: string, action: keyof typeof SEARCH.requestsPerMinute) {
  const [row] = await db.insert(searchRequestLimits).values({ userId, action, windowStart: new Date(), requests: 1 })
    .onConflictDoUpdate({ target: [searchRequestLimits.userId, searchRequestLimits.action], set: {
      windowStart: sql`case when ${searchRequestLimits.windowStart} <= now() - interval '1 minute' then now() else ${searchRequestLimits.windowStart} end`,
      requests: sql`case when ${searchRequestLimits.windowStart} <= now() - interval '1 minute' then 1 else least(${searchRequestLimits.requests} + 1, 1000000) end`,
    } }).returning();
  if (row.requests > SEARCH.requestsPerMinute[action]) throw new RequestError("Too many requests. Please wait a minute and try again.", 429, 60);
}

export async function getManualSearchUsage(access: AccountAccess) {
  if (!access.userId) throw new RequestError("Sign in to search", 401);
  const { day, resetsAt } = searchDay();
  const [row] = await db.select().from(manualSearchUsage)
    .where(and(eq(manualSearchUsage.userId, access.userId), eq(manualSearchUsage.day, day)));
  return usageFor(access, row?.used ?? 0, resetsAt);
}

export function compactMatches(matches: VendorAndPackagesMatchDTOType[]): SnapshotMatch[] {
  const seen = new Set<number>();
  return matches.map((match, position) => {
    const isTopPick = !seen.has(match.vendor.serviceId);
    seen.add(match.vendor.serviceId);
    return { vendorId: match.vendor.id, serviceId: match.vendor.serviceId,
      matchedPackageIds: match.packages.map((pkg) => pkg.id), position, isTopPick };
  });
}

async function getSnapshot(userId: string, searchId: string) {
  const condition = and(eq(manualSearchSnapshots.userId, userId), eq(manualSearchSnapshots.searchId, searchId));
  const [snapshot] = await db.select().from(manualSearchSnapshots).where(condition);
  if (snapshot) {
    if (snapshot.expiresAt.getTime() <= Date.now()) throw new RequestError("Your search results have expired. Your planning preferences are saved. Plan again to start a new search.", 410);
    return snapshot;
  }
  // Legacy rows are read-only and retain their original creation time.
  const [legacy] = await db.select().from(manualSearchResults).where(and(eq(manualSearchResults.userId, userId), eq(manualSearchResults.searchId, searchId)));
  if (!legacy || legacy.createdAt.getTime() + SEARCH.lifetimeMs <= Date.now()) {
    throw new RequestError("These search results are unavailable or expired. Your planning preferences are saved. Plan again to start a new search.", 410);
  }
  return { ...legacy, matches: compactMatches(legacy.matches as VendorAndPackagesMatchDTOType[]), expiresAt: new Date(legacy.createdAt.getTime() + SEARCH.lifetimeMs) };
}

// Fetch only the requested IDs, using current vendor and matched-package values.
async function hydrateMatches(entries: SnapshotMatch[]) {
  if (!entries.length) return [];
  const rows = await db.select({ vendor: vendorsTable, package: packagesTable }).from(vendorsTable)
    .innerJoin(packagesTable, eq(packagesTable.vendorId, vendorsTable.id))
    .where(and(inArray(vendorsTable.id, entries.map((entry) => entry.vendorId)),
      inArray(packagesTable.id, entries.flatMap((entry) => entry.matchedPackageIds))));
  const matches: VendorAndPackagesMatchDTOType[] = [];
  for (const entry of entries) {
    const current = rows.filter((row) => row.vendor.id === entry.vendorId && row.vendor.serviceId === entry.serviceId && entry.matchedPackageIds.includes(row.package.id));
    if (!current.length) continue;
    const vendor = current[0].vendor;
    matches.push({ vendor: { ...vendor, imageUrls: await getVendorImageUrls(vendor.imagePaths).catch(() => []) }, packages: current.map((row) => row.package) });
  }
  return matches;
}

export async function readManualSearch(access: AccountAccess, searchId: string, page = 1, applyThrottle = true, serviceId: number | null = null) {
  const userId = validateSearch(access, searchId);
  if (!Number.isSafeInteger(page) || page < 1) throw new RequestError("Invalid results page");
  if (serviceId !== null && (!Number.isSafeInteger(serviceId) || serviceId < 1)) throw new RequestError("Invalid service filter");
  if (applyThrottle) await throttleSearch(userId, "read");
  const snapshot = await getSnapshot(userId, searchId);
  const others = snapshot.matches.filter((match) => !match.isTopPick && (serviceId === null || match.serviceId === serviceId));
  const pageCount = Math.max(1, Math.ceil(others.length / SEARCH.pageSize));
  if (page > pageCount) throw new RequestError("Results page not found", 404);
  const top = snapshot.matches.filter((match) => match.isTopPick);
  const entries = [...top, ...others.slice((page - 1) * SEARCH.pageSize, page * SEARCH.pageSize)];
  const current = await hydrateMatches(entries);
  const topIds = new Set(top.map((match) => match.vendorId));
  // Check again after I/O, so requests spanning expiry cannot return expired results.
  if (snapshot.expiresAt.getTime() <= Date.now()) throw new RequestError("Your search results have expired. Plan again to start a new search.", 410);
  return { searchId, expiresAt: snapshot.expiresAt.toISOString(), page, pageCount, total: others.length,
    topMatches: projectVendorMatches(current.filter((match) => topIds.has(match.vendor.id)), access.canViewVendorIdentity),
    matches: projectVendorMatches(current.filter((match) => !topIds.has(match.vendor.id)), access.canViewVendorIdentity),
    usage: await getManualSearchUsage(access) };
}

export async function readManualSearchVendor(access: AccountAccess, searchId: string, vendorId: number) {
  const userId = validateSearch(access, searchId);
  if (!access.canViewVendorIdentity) throw new RequestError("An active Plus pass is required", 403);
  await throttleSearch(userId, "detail");
  const snapshot = await getSnapshot(userId, searchId);
  const entry = snapshot.matches.find((match) => match.vendorId === vendorId);
  if (!entry) throw new RequestError("Vendor not found in this search", 404);
  const [match] = await hydrateMatches([entry]);
  if (!match) throw new RequestError("This vendor or its matched packages are no longer available", 404);
  if (snapshot.expiresAt.getTime() <= Date.now()) throw new RequestError("Your search results have expired. Plan again to start a new search.", 410);
  return { ...match, identityLocked: false as const };
}

export async function runManualSearch(access: AccountAccess, searchId: string, preferences: VendorMatchDTOType[]) {
  const userId = validateSearch(access, searchId);
  if (!preferences.length) throw new RequestError("Choose at least one service");
  await throttleSearch(userId, "create");
  const fingerprint = createHash("sha256").update(JSON.stringify(preferences)).digest("hex");
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${userId}, 0))`);
    const [previous] = await tx.select().from(manualSearchSnapshots)
      .where(and(eq(manualSearchSnapshots.userId, userId), eq(manualSearchSnapshots.searchId, searchId)));
    const [legacy] = previous ? [] : await tx.select().from(manualSearchResults)
      .where(and(eq(manualSearchResults.userId, userId), eq(manualSearchResults.searchId, searchId)));
    const existing = previous ?? legacy;
    if (existing) {
      if (existing.fingerprint !== fingerprint) throw new RequestError("Search ID already belongs to different preferences", 409);
      const expiresAt = previous?.expiresAt ?? new Date(existing.createdAt.getTime() + SEARCH.lifetimeMs);
      if (expiresAt.getTime() <= Date.now()) throw new RequestError("Your search results have expired. Plan again to start a new search.", 410);
      return;
    }
    const { day } = searchDay();
    const [counter] = await tx.select().from(manualSearchUsage).where(and(eq(manualSearchUsage.userId, userId), eq(manualSearchUsage.day, day)));
    const limit = manualSearchLimit(access);
    if (limit !== null && (counter?.used ?? 0) >= limit) throw new RequestError(`You have used all ${limit} searches today. Your allowance resets at midnight Malaysia time.`, 429);
    const matches = await findVendorsByPreferences(preferences, tx, false);
    const createdAt = new Date();
    await tx.insert(manualSearchSnapshots).values({ userId, searchId, fingerprint, matches: compactMatches(matches), createdAt, expiresAt: new Date(createdAt.getTime() + SEARCH.lifetimeMs) });
    if (limit !== null) await tx.insert(manualSearchUsage).values({ userId, day, used: 1 })
      .onConflictDoUpdate({ target: [manualSearchUsage.userId, manualSearchUsage.day], set: { used: sql`${manualSearchUsage.used} + 1` } });
  });
  return readManualSearch(access, searchId, 1, false);
}
