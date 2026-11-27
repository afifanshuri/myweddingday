import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { shownVendors } from "@/db/schema";
import type { AccountAccess } from "@/types/accountAccess";

/**
 * Of the given vendors, those this account may look up again (shortlist, budget): vendors it was shown in search
 * results. Admins may look up any vendor. Others' IDs are treated as currently unavailable, so made-up IDs can't
 * be used to read the catalogue one vendor at a time.
 */
export async function shownVendorIds(access: AccountAccess, vendorIds: number[]): Promise<Set<number>> {
  const ids = [...new Set(vendorIds)];
  if (access.role === "admin") return new Set(ids);
  if (!access.userId || !ids.length) return new Set();
  const rows = await db.select({ vendorId: shownVendors.vendorId }).from(shownVendors)
    .where(and(eq(shownVendors.userId, access.userId), inArray(shownVendors.vendorId, ids)));
  return new Set(rows.map((row) => row.vendorId));
}
