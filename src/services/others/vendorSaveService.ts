import "server-only";
import { db } from "@/db";
import { packagesTable, vendorsTable } from "@/db/schema";
import { MAX_PACKAGE_ATTACHMENTS } from "@/config/uploads";
import { MAX_VENDOR_IMAGES } from "@/config/vendorImages";
import type { VendorStatus } from "@/config/vendorStatus";
import { object, positiveId, validatePackages, validateVendor } from "./requestValidation";
import { expectedUploads, planVendorFiles, validateFileRefs, type CurrentFiles } from "./vendorFilesPlan";
import { claimUploads, verifyUploads, type UploadOwner } from "./uploadService";
import { applyVendorEdit, assertCatalogueIds, currentVendorFiles, type Transaction } from "./vendorAdminService";
import { removeStoredImagesQuietly } from "./vendorImageService";

/** The vendor form's JSON body (create and edit alike). Files are references: saved paths or upload ids. */
export function validateVendorSave(value: unknown) {
  const data = object(value);
  const vendor = validateVendor(data.vendor);
  const base = validatePackages(data.packages, vendor.serviceId);
  const packages = base.map((pkg, index) => {
    const raw = object((data.packages as unknown[])[index]);
    return { ...pkg, id: raw.id === undefined || raw.id === null ? undefined : positiveId(raw.id),
      attachments: validateFileRefs(raw.attachments, MAX_PACKAGE_ATTACHMENTS, "attachments per package") };
  });
  return { vendor, images: validateFileRefs(data.images, MAX_VENDOR_IMAGES, "vendor photos"), packages };
}
export type VendorSaveInput = ReturnType<typeof validateVendorSave>;

const EMPTY: CurrentFiles = { imagePaths: [], packages: [] };

/**
 * Saves a vendor and its packages from the form, for admins and vendor submissions alike.
 * - `vendorId: null` creates a vendor with `status`; otherwise the vendor is edited (refused if it changed meanwhile).
 * - New files must be uploads by `owner`; they're checked in Storage first, then claimed inside the save transaction.
 * - `inTransaction` runs first inside the transaction (e.g. re-checking a submission link); `afterSave` runs last in it.
 * - After the save, stored files the listing no longer uses are deleted. If the save fails, nothing is deleted
 *   and the uploads stay available for a retry.
 */
export async function saveVendorListing(params: {
  owner: UploadOwner; vendorId: number | null; input: VendorSaveInput; status?: VendorStatus;
  inTransaction?: (tx: Transaction) => Promise<void>; afterSave?: (tx: Transaction, vendorId: number) => Promise<void>;
}) {
  const { owner, input } = params;
  await assertCatalogueIds(input.vendor);
  const current = params.vendorId === null ? EMPTY : await currentVendorFiles(params.vendorId);
  const expected = expectedUploads(input.images, input.packages);
  const uploads = await verifyUploads(owner, expected);
  const plan = planVendorFiles(current, input.images, input.packages, uploads);
  const records = input.packages.map(({ attachments: _refs, ...pkg }, index) => ({ ...pkg, attachments: plan.attachments[index] }));

  const vendorId = await db.transaction(async (tx) => {
    await params.inTransaction?.(tx);
    let id: number;
    if (params.vendorId === null) {
      const [created] = await tx.insert(vendorsTable).values({ ...input.vendor, imagePaths: plan.imagePaths, status: params.status ?? "pending" })
        .returning({ id: vendorsTable.id });
      id = created.id;
      await tx.insert(packagesTable).values(records.map(({ id: _id, ...pkg }) => ({ ...pkg, vendorId: id })));
    } else {
      id = params.vendorId;
      await applyVendorEdit(tx, id, current, { ...input.vendor, imagePaths: plan.imagePaths }, records, plan.deletedPackageIds);
    }
    await claimUploads(tx, owner, [...expected.keys()]);
    await params.afterSave?.(tx, id);
    return id;
  });
  if (plan.removed.length) await removeStoredImagesQuietly(plan.removed);
  return { id: vendorId };
}
