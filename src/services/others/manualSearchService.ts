import "server-only";
import { createHash } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { freeSearches, manualSearchSnapshots, searchRequestLimits, unlockedVendors, vendorsTable, packagesTable, shownVendors } from "@/db/schema";
import { findVendorsByPreferences } from "@/db/queries/vendors";
import { manualSearchLimit, PLANS, SEARCH } from "@/config/plans";
import type { AccountAccess } from "@/types/accountAccess";
import type { VendorAndPackagesMatchDTOType, VendorMatchDTOType } from "@/types/dtoTypes";
import type { SearchUsage, SnapshotMatch } from "@/types/search";
import { RequestError } from "./requestValidation";
import { projectVendorMatch } from "./vendorResponseService";
import { getVendorImageUrlsBatch, signAttachments } from "./vendorImageService";
import { capMatches, interleaveByService, pickFreeUnlocks } from "./searchCap";
import { unlockedVendorIds } from "./unlockService";

const capped = (matches: SnapshotMatch[]) => capMatches(matches, (match) => match.serviceId, SEARCH.maxPerService);
export const FREE_SEARCH_USED = "You've used your free search. Get Plus to search again and see every match.";

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

/** Free accounts have one search, ever; Plus and admins are unlimited. */
export async function getManualSearchUsage(access: AccountAccess): Promise<SearchUsage> {
  if (!access.userId) throw new RequestError("Sign in to search", 401);
  const limit = manualSearchLimit(access);
  if (limit === null) return { used: 0, limit: null, remaining: null };
  const [row] = await db.select({ userId: freeSearches.userId }).from(freeSearches).where(eq(freeSearches.userId, access.userId));
  const used = row ? 1 : 0;
  return { used, limit, remaining: Math.max(0, limit - used) };
}

export function compactMatches(matches: { vendor: { id: number; serviceId: number }; packages: { id: number }[] }[]): SnapshotMatch[] {
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
  if (!snapshot) throw new RequestError("These search results are unavailable or expired. Your planning preferences are saved.", 410);
  if (snapshot.expiresAt.getTime() <= Date.now()) throw new RequestError("Your search results have expired. Your planning preferences are saved.", 410);
  // Also caps searches saved before the limit existed.
  return { ...snapshot, matches: capped(snapshot.matches) };
}

/** Keeps snapshot entries whose vendor still exists, is approved, and is in the same service with at least one matched package. */
async function availableEntries(entries: SnapshotMatch[]) {
  if (!entries.length) return [];
  const rows = await db.selectDistinct({ vendorId: vendorsTable.id, serviceId: vendorsTable.serviceId, packageId: packagesTable.id })
    .from(vendorsTable).innerJoin(packagesTable, eq(packagesTable.vendorId, vendorsTable.id))
    .where(and(eq(vendorsTable.status, "approved"), inArray(vendorsTable.id, [...new Set(entries.map((entry) => entry.vendorId))]),
      inArray(packagesTable.id, [...new Set(entries.flatMap((entry) => entry.matchedPackageIds))])));
  const live = new Set(rows.map((row) => `${row.vendorId}:${row.serviceId}:${row.packageId}`));
  return entries.filter((entry) => entry.matchedPackageIds.some((packageId) => live.has(`${entry.vendorId}:${entry.serviceId}:${packageId}`)));
}

// Fetch only the requested IDs, using current vendor and matched-package values.
// Attachments are signed only for vendors the user may see in full; everyone else gets none.
async function hydrateMatches(entries: SnapshotMatch[], fullDetails: (vendorId: number) => boolean) {
  if (!entries.length) return [];
  const rows = await db.select({ vendor: vendorsTable, package: packagesTable }).from(vendorsTable)
    .innerJoin(packagesTable, eq(packagesTable.vendorId, vendorsTable.id))
    .where(and(eq(vendorsTable.status, "approved"), inArray(vendorsTable.id, entries.map((entry) => entry.vendorId)),
      inArray(packagesTable.id, entries.flatMap((entry) => entry.matchedPackageIds))));
  const found = entries.flatMap((entry) => {
    const current = rows.filter((row) => row.vendor.id === entry.vendorId && row.vendor.serviceId === entry.serviceId && entry.matchedPackageIds.includes(row.package.id));
    return current.length ? [{ vendor: current[0].vendor, packages: current.map((row) => row.package) }] : [];
  });
  // One storage request signs every photo on the page.
  const imageUrls = await getVendorImageUrlsBatch(found.map(({ vendor }) => vendor.imagePaths)).catch(() => found.map(() => []));
  const signed = found.flatMap(({ vendor, packages }) => fullDetails(vendor.id) ? packages.map((pkg) => pkg.attachments) : []);
  const attachments = signed.length ? await signAttachments(signed).catch(() => null) : null;
  let next = 0;
  return found.map(({ vendor, packages }, index): VendorAndPackagesMatchDTOType => {
    const full = fullDetails(vendor.id);
    return {
      vendor: { ...vendor, imageUrls: imageUrls[index] },
      packages: packages.map((pkg) => ({ ...pkg, attachments: full ? attachments?.[next++] ?? [] : [] })),
    };
  });
}

/**
 * A page of a saved search. Plus (and admins) see every match in full. A free account sees the top picks as locked
 * previews and, in the list, only the vendors its free search unlocked (in full); the rest are only counted.
 */
export async function readManualSearch(access: AccountAccess, searchId: string, requestedPage = 1, applyThrottle = true, serviceId: number | null = null) {
  const userId = validateSearch(access, searchId);
  if (!Number.isSafeInteger(requestedPage) || requestedPage < 1) throw new RequestError("Invalid results page");
  if (serviceId !== null && (!Number.isSafeInteger(serviceId) || serviceId < 1)) throw new RequestError("Invalid service filter");
  if (applyThrottle) await throttleSearch(userId, "read");
  const snapshot = await getSnapshot(userId, searchId);
  const plus = access.canViewVendorIdentity;
  const unlocked = plus ? null : await unlockedVendorIds(userId, snapshot.matches.map((match) => match.vendorId));
  const visible = (vendorId: number) => plus || !!unlocked?.has(vendorId);
  // Count only vendors that still exist, so totals and page numbers stay right after deletions.
  const available = await availableEntries(snapshot.matches);
  const inFilter = (match: SnapshotMatch) => !match.isTopPick && (serviceId === null || match.serviceId === serviceId);
  const listed = available.filter(inFilter);
  const shown = listed.filter((match) => visible(match.vendorId));
  // "All services" mixes the services on every page; a single service keeps its own order.
  const others = serviceId === null ? interleaveByService(shown, (match) => match.serviceId) : shown;
  const pageCount = Math.max(1, Math.ceil(others.length / SEARCH.pageSize));
  // A page that never existed is an error; a page that emptied because vendors were deleted shows the last page instead.
  const everShown = snapshot.matches.filter((match) => inFilter(match) && visible(match.vendorId)).length;
  if (requestedPage > Math.max(1, Math.ceil(everShown / SEARCH.pageSize))) throw new RequestError("Results page not found", 404);
  const page = Math.min(requestedPage, pageCount);
  const top = available.filter((match) => match.isTopPick);
  const topIds = new Set(top.map((match) => match.vendorId));
  const entries = [...top, ...others.slice((page - 1) * SEARCH.pageSize, page * SEARCH.pageSize)];
  // Top picks are full for Plus only; list entries are full when visible (unlocked for free accounts).
  const fullDetails = (vendorId: number) => plus || (!topIds.has(vendorId) && visible(vendorId));
  const current = await hydrateMatches(entries, fullDetails);
  // Check again after I/O, so requests spanning expiry cannot return expired results.
  if (snapshot.expiresAt.getTime() <= Date.now()) throw new RequestError("Your search results have expired. Your planning preferences are saved.", 410);
  return { searchId, expiresAt: snapshot.expiresAt.toISOString(), page, pageCount, total: others.length,
    lockedCount: listed.length - shown.length,
    topMatches: current.filter((match) => topIds.has(match.vendor.id)).map((match) => projectVendorMatch(match, plus)),
    matches: current.filter((match) => !topIds.has(match.vendor.id)).map((match) => projectVendorMatch(match, fullDetails(match.vendor.id))),
    usage: await getManualSearchUsage(access) };
}

/** One vendor's matched packages from a saved search: for Plus, or a free account that unlocked this vendor. */
export async function readManualSearchVendor(access: AccountAccess, searchId: string, vendorId: number) {
  const userId = validateSearch(access, searchId);
  await throttleSearch(userId, "detail");
  const snapshot = await getSnapshot(userId, searchId);
  const entry = snapshot.matches.find((match) => match.vendorId === vendorId);
  if (!entry) throw new RequestError("Vendor not found in this search", 404);
  if (!access.canViewVendorIdentity && (entry.isTopPick || !(await unlockedVendorIds(userId, [vendorId])).has(vendorId))) {
    throw new RequestError("Get Plus to see this vendor's details", 403);
  }
  const [match] = await hydrateMatches([entry], () => true);
  if (!match) throw new RequestError("This vendor or its matched packages are no longer available", 404);
  if (snapshot.expiresAt.getTime() <= Date.now()) throw new RequestError("Your search results have expired. Your planning preferences are saved.", 410);
  return { ...match, identityLocked: false as const };
}

export async function runManualSearch(access: AccountAccess, searchId: string, preferences: VendorMatchDTOType[]) {
  const userId = validateSearch(access, searchId);
  if (!preferences.length) throw new RequestError("Choose at least one service");
  await throttleSearch(userId, "create");
  const fingerprint = createHash("sha256").update(JSON.stringify(preferences)).digest("hex");
  await db.transaction(async (tx) => {
    // One search at a time per account, so the free search can't be used twice by parallel requests.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${userId}, 0))`);
    const [existing] = await tx.select().from(manualSearchSnapshots)
      .where(and(eq(manualSearchSnapshots.userId, userId), eq(manualSearchSnapshots.searchId, searchId)));
    if (existing) {
      // A retry of the same search (same ID and preferences) reuses it and isn't counted again.
      if (existing.fingerprint !== fingerprint) throw new RequestError("Search ID already belongs to different preferences", 409);
      if (existing.expiresAt.getTime() <= Date.now()) throw new RequestError("Your search results have expired. Your planning preferences are saved.", 410);
      return;
    }
    const limit = manualSearchLimit(access);
    if (limit !== null) {
      const [used] = await tx.select({ userId: freeSearches.userId }).from(freeSearches).where(eq(freeSearches.userId, userId));
      if (used) throw new RequestError(FREE_SEARCH_USED, 403);
    } else if (access.role !== "admin") {
      // Plus fair use: counted from the saved searches, which last at least a day (SEARCH.lifetimeMs).
      const [{ recent }] = await tx.select({ recent: sql<number>`count(*)::integer` }).from(manualSearchSnapshots)
        .where(and(eq(manualSearchSnapshots.userId, userId), sql`${manualSearchSnapshots.createdAt} > now() - interval '24 hours'`));
      if (recent >= PLANS.plus.searchesPerDay) {
        throw new RequestError(`You've reached the limit of ${PLANS.plus.searchesPerDay} searches in 24 hours. Please try again later.`, 429, 3600);
      }
    }
    const matches = capped(compactMatches(await findVendorsByPreferences(preferences, tx, false)));
    const createdAt = new Date();
    await tx.insert(manualSearchSnapshots).values({ userId, searchId, fingerprint, matches, createdAt, expiresAt: new Date(createdAt.getTime() + SEARCH.lifetimeMs) });
    // Everything in the results (full or locked preview) can be shortlisted and budgeted later (shownVendorIds).
    const shown = [...new Set(matches.map((match) => match.vendorId))];
    if (shown.length) await tx.insert(shownVendors).values(shown.map((vendorId) => ({ userId, vendorId, shownAt: createdAt }))).onConflictDoNothing();
    if (limit !== null) {
      // The primary key allows one free search per account, even if the lock above were ever bypassed.
      await tx.insert(freeSearches).values({ userId, searchId, usedAt: createdAt });
      const vendorIds = pickFreeUnlocks(matches, PLANS.free.unlockedPerService);
      if (vendorIds.length) await tx.insert(unlockedVendors).values(vendorIds.map((vendorId) => ({ userId, vendorId, unlockedAt: createdAt }))).onConflictDoNothing();
    }
  });
  return readManualSearch(access, searchId, 1, false);
}
