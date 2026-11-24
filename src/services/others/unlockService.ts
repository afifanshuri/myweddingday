import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { unlockedVendors } from "@/db/schema";

/** Of the given vendors, those this free account unlocked with its free search (kept permanently). */
export async function unlockedVendorIds(userId: string, vendorIds: number[]): Promise<Set<number>> {
  const ids = [...new Set(vendorIds)];
  if (!ids.length) return new Set();
  const rows = await db.select({ vendorId: unlockedVendors.vendorId }).from(unlockedVendors)
    .where(and(eq(unlockedVendors.userId, userId), inArray(unlockedVendors.vendorId, ids)));
  return new Set(rows.map((row) => row.vendorId));
}
