import "server-only";
import { db } from "@/db";
import { locationTable, packagesTable, servicesTable, vendorsTable } from "@/db/schema";
import { and, count, desc, eq, ilike, inArray, type SQL } from "drizzle-orm";
import { RequestError, type validateVendor } from "./requestValidation";
import { updateVendorWithPackages, type PackageEdit, type PackageRecord } from "./vendorSaveWorkflow";
import { createPackageImageStorage } from "./packageImageService";
import { createVendorImageStorage, getPackageImageUrls, getVendorImageUrlsBatch, removeStoredImages } from "./vendorImageService";

export const ADMIN_VENDOR_PAGE_SIZE = 20;
type VendorInput = ReturnType<typeof validateVendor>;

/** Escapes LIKE wildcards so the search text is matched literally. */
export const likePattern = (query: string) => `%${query.replace(/[\\%_]/g, (char) => "\\" + char)}%`;

/** Admin list: newest first, optional name search (case-insensitive, literal) and service filter. */
export async function listAdminVendors({ query, serviceId, page }: { query: string; serviceId: number | null; page: number }) {
  const conditions: SQL[] = [];
  if (query) conditions.push(ilike(vendorsTable.vendorName, likePattern(query)));
  if (serviceId !== null) conditions.push(eq(vendorsTable.serviceId, serviceId));
  const where = conditions.length ? and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(vendorsTable).where(where);
  const rows = await db.select({ id: vendorsTable.id, vendorName: vendorsTable.vendorName, serviceId: vendorsTable.serviceId,
    serviceName: servicesTable.serviceName, createdAt: vendorsTable.createdAt, locations: vendorsTable.locationId })
    .from(vendorsTable).innerJoin(servicesTable, eq(servicesTable.id, vendorsTable.serviceId))
    .where(where).orderBy(desc(vendorsTable.createdAt), desc(vendorsTable.id))
    .limit(ADMIN_VENDOR_PAGE_SIZE).offset((page - 1) * ADMIN_VENDOR_PAGE_SIZE);
  const packageCounts = rows.length ? await db.select({ vendorId: packagesTable.vendorId, packages: count() }).from(packagesTable)
    .where(inArray(packagesTable.vendorId, rows.map((row) => row.id))).groupBy(packagesTable.vendorId) : [];
  return {
    vendors: rows.map(({ locations, ...row }) => ({ ...row, locationCount: locations.length,
      packageCount: packageCounts.find((item) => item.vendorId === row.id)?.packages ?? 0 })),
    page, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_VENDOR_PAGE_SIZE)),
  };
}

async function loadVendor(id: number) {
  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, id));
  if (!vendor) throw new RequestError("Vendor not found", 404);
  const packages = await db.select().from(packagesTable).where(eq(packagesTable.vendorId, id)).orderBy(packagesTable.id);
  return { vendor, packages };
}

/** Everything the edit form needs, with short-lived image links for previews. */
export async function getAdminVendor(id: number) {
  const { vendor, packages } = await loadVendor(id);
  const [vendorUrls, packageUrls] = await Promise.all([
    getVendorImageUrlsBatch(vendor.imagePaths.map((path) => [path])), getPackageImageUrls(packages.map((pkg) => pkg.filePath)),
  ]);
  return {
    vendor: { id: vendor.id, vendorName: vendor.vendorName, serviceId: vendor.serviceId, locationId: vendor.locationId,
      contact: vendor.contact, detail: vendor.detail, instagram: vendor.instagram, facebook: vendor.facebook, tiktok: vendor.tiktok },
    images: vendor.imagePaths.map((path, index) => ({ path, url: vendorUrls[index][0] ?? null })),
    packages: packages.map((pkg, index) => ({ id: pkg.id, name: pkg.packageName, price: pkg.price, details: pkg.details ?? "",
      filters: pkg.filters ?? {}, imageUrl: packageUrls[index], hasImage: !!pkg.filePath })),
  };
}

export async function assertCatalogueIds(vendor: VendorInput) {
  const [services, locations] = await Promise.all([
    db.select({ id: servicesTable.id }).from(servicesTable).where(eq(servicesTable.id, vendor.serviceId)),
    db.select({ id: locationTable.id }).from(locationTable).where(inArray(locationTable.id, vendor.locationId)),
  ]);
  if (!services.length || locations.length !== vendor.locationId.length) throw new RequestError("Selected service or location does not exist");
}

const sameList = <T,>(a: T[], b: T[]) => a.length === b.length && a.every((value, index) => value === b[index]);

export async function updateAdminVendor(id: number, input: { vendor: VendorInput; packages: PackageEdit[]; files: (File | null)[];
  keepImagePaths: string[]; vendorFiles: File[] }) {
  await assertCatalogueIds(input.vendor);
  const current = await loadVendor(id);
  const before = { imagePaths: current.vendor.imagePaths, packages: current.packages.map((pkg) => ({ id: pkg.id, filePath: pkg.filePath })) };
  await updateVendorWithPackages(before, input, {
    uploadVendor: createVendorImageStorage().upload,
    uploadPackage: createPackageImageStorage().upload,
    remove: removeStoredImages,
    save: (vendor, packages, deletedIds) => db.transaction(async (tx) => {
      // Refuse if someone else changed this vendor's images or packages since it was loaded,
      // so cleanup never deletes a file another save has just started using.
      const [locked] = await tx.select({ imagePaths: vendorsTable.imagePaths }).from(vendorsTable).where(eq(vendorsTable.id, id)).for("update");
      if (!locked) throw new RequestError("Vendor not found", 404);
      const rows = await tx.select({ id: packagesTable.id, filePath: packagesTable.filePath }).from(packagesTable)
        .where(eq(packagesTable.vendorId, id)).orderBy(packagesTable.id);
      if (!sameList(locked.imagePaths, before.imagePaths) || !sameList(rows.map((row) => row.id), before.packages.map((pkg) => pkg.id))
        || !sameList(rows.map((row) => row.filePath), before.packages.map((pkg) => pkg.filePath))) {
        throw new RequestError("This vendor was changed by someone else. Reload the page and try again.", 409);
      }
      await tx.update(vendorsTable).set(vendor).where(eq(vendorsTable.id, id));
      if (deletedIds.length) await tx.delete(packagesTable).where(and(eq(packagesTable.vendorId, id), inArray(packagesTable.id, deletedIds)));
      for (const pkg of packages) {
        if (pkg.id === undefined) continue;
        const { id: packageId, ...values } = pkg;
        await tx.update(packagesTable).set(values).where(and(eq(packagesTable.id, packageId), eq(packagesTable.vendorId, id)));
      }
      const added = packages.filter((pkg): pkg is PackageRecord & { id: undefined } => pkg.id === undefined)
        .map((pkg) => ({ packageName: pkg.packageName, price: pkg.price, details: pkg.details, filters: pkg.filters, filePath: pkg.filePath, vendorId: id }));
      if (added.length) await tx.insert(packagesTable).values(added);
    }),
  });
  return { id };
}

/** Deletes the vendor and its packages, then their stored images (best effort, after the rows are gone). */
export async function deleteAdminVendor(id: number) {
  const paths = await db.transaction(async (tx) => {
    const [vendor] = await tx.select({ imagePaths: vendorsTable.imagePaths, filePath: vendorsTable.filePath }).from(vendorsTable)
      .where(eq(vendorsTable.id, id)).for("update");
    if (!vendor) throw new RequestError("Vendor not found", 404);
    const packages = await tx.delete(packagesTable).where(eq(packagesTable.vendorId, id)).returning({ filePath: packagesTable.filePath });
    await tx.delete(vendorsTable).where(eq(vendorsTable.id, id));
    return [...vendor.imagePaths, vendor.filePath, ...packages.map((pkg) => pkg.filePath)].filter((path): path is string => !!path);
  });
  try { await removeStoredImages(paths); }
  catch { console.error("Image cleanup failed; orphaned uploads require cleanup"); }
}
