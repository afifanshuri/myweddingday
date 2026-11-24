import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { packagesTable, vendorsTable } from "@/db/schema";
import { WEDDING_PLAN } from "@/config/weddingPlan";
import type { AccountAccess } from "@/types/accountAccess";
import type { VendorAndPackagesMatchDTOType, VendorMatchResult } from "@/types/dtoTypes";
import { RequestError, positiveId } from "./requestValidation";
import { throttleSearch } from "./manualSearchService";
import { projectVendorMatch } from "./vendorResponseService";
import { getVendorImageUrlsBatch, signAttachments } from "./vendorImageService";
import { unlockedVendorIds } from "./unlockService";

export function validateShortlistIds(value: unknown): number[] {
  if (!Array.isArray(value) || value.length > WEDDING_PLAN.maxShortlist) throw new RequestError("Invalid shortlist");
  return [...new Set(value.map(positiveId))];
}

/**
 * Current details of the user's shortlisted vendors, with all their packages (a shortlist outlives any search).
 * Only approved vendors are returned; the rest are listed in `missing` so the browser can drop them.
 * Plus sees every vendor in full. A free account sees the vendors its free search unlocked in full, and the rest
 * as locked previews (photos, rating, cheapest price), never names, contacts or packages.
 */
export async function readShortlist(access: AccountAccess, vendorIds: number[]) {
  if (!access.userId) throw new RequestError("Sign in to see your shortlist", 401);
  await throttleSearch(access.userId, "shortlist");
  if (!vendorIds.length) return { vendors: [] as VendorMatchResult[], missing: [] as number[] };
  const free = access.canViewVendorIdentity ? null : await unlockedVendorIds(access.userId, vendorIds);
  const unlocked = (vendorId: number) => !free || free.has(vendorId);
  const rows = await db.select({ vendor: vendorsTable, package: packagesTable }).from(vendorsTable)
    .innerJoin(packagesTable, eq(packagesTable.vendorId, vendorsTable.id))
    .where(and(eq(vendorsTable.status, "approved"), inArray(vendorsTable.id, vendorIds)));
  const found = vendorIds.flatMap((id) => {
    const current = rows.filter((row) => row.vendor.id === id);
    return current.length ? [{ vendor: current[0].vendor, packages: current.map((row) => row.package) }] : [];
  });
  const imageUrls = await getVendorImageUrlsBatch(found.map(({ vendor }) => vendor.imagePaths)).catch(() => found.map(() => []));
  // Attachments are signed only for vendors shown in full.
  const signed = found.flatMap(({ vendor, packages }) => unlocked(vendor.id) ? packages.map((pkg) => pkg.attachments) : []);
  const attachments = signed.length ? await signAttachments(signed).catch(() => null) : null;
  let next = 0;
  const vendors = found.map(({ vendor, packages }, index) => {
    const full = unlocked(vendor.id);
    return projectVendorMatch({
      vendor: { ...vendor, imageUrls: imageUrls[index] },
      packages: packages.map((pkg) => ({ ...pkg, attachments: full ? attachments?.[next++] ?? [] : [] })),
    } as VendorAndPackagesMatchDTOType, full);
  });
  const present = new Set(found.map(({ vendor }) => vendor.id));
  return { vendors, missing: vendorIds.filter((id) => !present.has(id)) };
}
