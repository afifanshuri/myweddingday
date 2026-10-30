import "server-only";
import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { manualSearchResults, manualSearchUsage } from "@/db/schema";
import { findVendorsByPreferences } from "@/db/queries/vendors";
import { manualSearchLimit, searchDay } from "@/config/plans";
import type { AccountAccess } from "@/types/accountAccess";
import type { VendorAndPackagesMatchDTOType, VendorMatchDTOType } from "@/types/dtoTypes";
import type { SearchUsage } from "@/types/search";
import { RequestError } from "./requestValidation";
import { projectVendorMatches } from "./vendorResponseService";
import { getVendorImageUrls } from "./vendorImageService";

function usageFor(access: AccountAccess, used: number, resetsAt: string): SearchUsage {
  const limit = manualSearchLimit(access);
  return { used, limit, remaining: limit === null ? null : Math.max(0, limit - used), resetsAt };
}

export async function getManualSearchUsage(access: AccountAccess) {
  if (!access.userId) throw new RequestError("Sign in to search", 401);
  const { day, resetsAt } = searchDay();
  const [row] = await db.select().from(manualSearchUsage)
    .where(and(eq(manualSearchUsage.userId, access.userId), eq(manualSearchUsage.day, day)));
  return usageFor(access, row?.used ?? 0, resetsAt);
}

export async function runManualSearch(access: AccountAccess, searchId: string, preferences: VendorMatchDTOType[]) {
  if (!access.userId) throw new RequestError("Sign in to search", 401);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(searchId)) {
    throw new RequestError("A valid search ID is required");
  }
  if (!preferences.length) throw new RequestError("Choose at least one service");
  const userId = access.userId;
  const fingerprint = createHash("sha256").update(JSON.stringify(preferences)).digest("hex");
  const saved = await db.transaction(async (tx) => {
    // Serialize searches for this account across tabs, devices and server instances.
    // The lock, usage increment and snapshot commit/rollback as one transaction.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${userId}, 0))`);
    const { day, resetsAt } = searchDay();
    const [previous] = await tx.select().from(manualSearchResults)
      .where(and(eq(manualSearchResults.userId, userId), eq(manualSearchResults.searchId, searchId)));
    const [counter] = await tx.select().from(manualSearchUsage)
      .where(and(eq(manualSearchUsage.userId, userId), eq(manualSearchUsage.day, day)));
    const used = counter?.used ?? 0;
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new RequestError("Search ID already belongs to different preferences", 409);
      return { matches: previous.matches as VendorAndPackagesMatchDTOType[], usage: usageFor(access, used, resetsAt) };
    }
    const limit = manualSearchLimit(access);
    if (limit !== null && used >= limit) {
      throw new RequestError(`You have used all ${limit} searches today. Your allowance resets at midnight Malaysia time.`, 429);
    }
    const matches = await findVendorsByPreferences(preferences, tx, false);
    await tx.insert(manualSearchResults).values({ userId, searchId, fingerprint, matches });
    // Only free searches consume the free allowance. Successful empty results count.
    if (limit !== null) {
      await tx.insert(manualSearchUsage).values({ userId, day, used: 1 })
        .onConflictDoUpdate({ target: [manualSearchUsage.userId, manualSearchUsage.day], set: { used: sql`${manualSearchUsage.used} + 1` } });
    }
    return { matches, usage: usageFor(access, used + (limit === null ? 0 : 1), resetsAt) };
  });
  // Signed image URLs expire; regenerate them from saved paths without rerunning matching.
  const matches = await Promise.all(saved.matches.map(async (match) => ({
    ...match, vendor: { ...match.vendor, imageUrls: await getVendorImageUrls(match.vendor.imagePaths).catch(() => []) },
  })));
  return { searchId, matches: projectVendorMatches(matches, access.canViewVendorIdentity), usage: saved.usage };
}
