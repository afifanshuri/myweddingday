import "server-only";
import { asc, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { packagesTable, vendorsTable } from "@/db/schema";
import { VENDOR_LOOKUP } from "@/config/plans";
import type { AccountAccess } from "@/types/accountAccess";
import type { VendorLookupResult } from "@/types/search";
import { RequestError } from "./requestValidation";
import { throttleSearch } from "./manualSearchService";
import { getVendorImageUrlsBatch } from "./vendorImageService";
import { escapeLikePattern, normalizeLookupQuery } from "./vendorLookupRules";

/**
 * Paid vendor-name lookup. Bounded by design: at most VENDOR_LOOKUP.maxResults
 * vendors per query, no pagination, and a per-account per-minute throttle.
 */
export async function lookupVendorsByName(access: AccountAccess, rawQuery: unknown): Promise<VendorLookupResult> {
  if (!access.userId) throw new RequestError("Sign in to search vendors", 401);
  if (!access.canViewVendorIdentity) throw new RequestError("An active Plus pass is required", 403);
  const query = normalizeLookupQuery(rawQuery);
  await throttleSearch(access.userId, "lookup");

  const escaped = escapeLikePattern(query);
  const contains = `%${escaped}%`;
  const prefix = `${escaped}%`;
  const vendors = await db.select().from(vendorsTable)
    .where(sql`${vendorsTable.vendorName} ilike ${contains} escape '\\'`)
    .orderBy(
      sql`case when ${vendorsTable.vendorName} ilike ${prefix} escape '\\' then 0 else 1 end`,
      sql`${vendorsTable.rating} desc nulls last`,
      asc(vendorsTable.id),
    )
    .limit(VENDOR_LOOKUP.maxResults + 1);

  const limited = vendors.length > VENDOR_LOOKUP.maxResults;
  const page = vendors.slice(0, VENDOR_LOOKUP.maxResults);
  if (!page.length) return { query, results: [], limited: false };

  const [packages, imageUrls] = await Promise.all([
    db.select().from(packagesTable)
      .where(inArray(packagesTable.vendorId, page.map((vendor) => vendor.id)))
      .orderBy(asc(packagesTable.price), asc(packagesTable.id)),
    getVendorImageUrlsBatch(page.map((vendor) => vendor.imagePaths)),
  ]);

  return {
    query,
    limited,
    results: page.map((vendor, index) => ({
      identityLocked: false as const,
      vendor: { ...vendor, imageUrls: imageUrls[index] },
      packages: packages.filter((pkg) => pkg.vendorId === vendor.id),
    })),
  };
}
