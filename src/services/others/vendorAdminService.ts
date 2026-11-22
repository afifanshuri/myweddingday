import "server-only";
import { db } from "@/db";
import { locationTable, packagesTable, servicesTable, vendorSubmissionLinks, vendorsTable } from "@/db/schema";
import { and, count, desc, eq, ilike, inArray, type SQL } from "drizzle-orm";
import type { VendorStatus } from "@/config/vendorStatus";
import { vendorMessages } from "./vendorMessages";
import { RequestError, type validatePackages, type validateVendor } from "./requestValidation";
import { getVendorImageUrlsBatch, removeStoredImagesQuietly, signAttachments } from "./vendorImageService";
import type { CurrentFiles } from "./vendorFilesPlan";
import type { StoredAttachment } from "@/config/uploads";

export const ADMIN_VENDOR_PAGE_SIZE = 20;
type VendorInput = ReturnType<typeof validateVendor>;
export type PackageRecord = ReturnType<typeof validatePackages>[number] & { id?: number; attachments: StoredAttachment[] };
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Escapes LIKE wildcards so the search text is matched literally. */
export const likePattern = (query: string) => `%${query.replace(/[\\%_]/g, (char) => "\\" + char)}%`;

/** Admin list: newest first, optional name search (case-insensitive, literal), service and status filters. */
export async function listAdminVendors({ query, serviceId, status, page }: { query: string; serviceId: number | null; status: VendorStatus | null; page: number }) {
  const conditions: SQL[] = [];
  if (status !== null) conditions.push(eq(vendorsTable.status, status));
  if (query) conditions.push(ilike(vendorsTable.vendorName, likePattern(query)));
  if (serviceId !== null) conditions.push(eq(vendorsTable.serviceId, serviceId));
  const where = conditions.length ? and(...conditions) : undefined;
  const [[{ total }], [{ pending }]] = await Promise.all([
    db.select({ total: count() }).from(vendorsTable).where(where),
    db.select({ pending: count() }).from(vendorsTable).where(eq(vendorsTable.status, "pending")),
  ]);
  const rows = await db.select({ id: vendorsTable.id, vendorName: vendorsTable.vendorName, serviceId: vendorsTable.serviceId,
    serviceName: servicesTable.serviceName, createdAt: vendorsTable.createdAt, locations: vendorsTable.locationId, status: vendorsTable.status })
    .from(vendorsTable).innerJoin(servicesTable, eq(servicesTable.id, vendorsTable.serviceId))
    .where(where).orderBy(desc(vendorsTable.createdAt), desc(vendorsTable.id))
    .limit(ADMIN_VENDOR_PAGE_SIZE).offset((page - 1) * ADMIN_VENDOR_PAGE_SIZE);
  const packageCounts = rows.length ? await db.select({ vendorId: packagesTable.vendorId, packages: count() }).from(packagesTable)
    .where(inArray(packagesTable.vendorId, rows.map((row) => row.id))).groupBy(packagesTable.vendorId) : [];
  return {
    vendors: rows.map(({ locations, ...row }) => ({ ...row, locationCount: locations.length,
      packageCount: packageCounts.find((item) => item.vendorId === row.id)?.packages ?? 0 })),
    page, total, pendingCount: pending, pageCount: Math.max(1, Math.ceil(total / ADMIN_VENDOR_PAGE_SIZE)),
  };
}

/** The vendor's stored image paths and package files, for edits. */
export async function currentVendorFiles(id: number): Promise<CurrentFiles> {
  const { vendor, packages } = await loadVendor(id);
  return { imagePaths: vendor.imagePaths, packages: packages.map((pkg) => ({ id: pkg.id, attachments: pkg.attachments })) };
}

async function loadVendor(id: number) {
  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, id));
  if (!vendor) throw new RequestError("Vendor not found", 404);
  const packages = await db.select().from(packagesTable).where(eq(packagesTable.vendorId, id)).orderBy(packagesTable.id);
  return { vendor, packages };
}

/** Everything the vendor form needs, with short-lived image links for previews. */
export async function loadVendorForm(id: number) {
  const { vendor, packages } = await loadVendor(id);
  const [vendorUrls, attachmentUrls] = await Promise.all([
    getVendorImageUrlsBatch(vendor.imagePaths.map((path) => [path])), signAttachments(packages.map((pkg) => pkg.attachments)),
  ]);
  return {
    record: vendor,
    form: {
      vendor: { id: vendor.id, vendorName: vendor.vendorName, serviceId: vendor.serviceId, locationId: vendor.locationId,
        contact: vendor.contact, detail: vendor.detail, instagram: vendor.instagram, facebook: vendor.facebook, tiktok: vendor.tiktok },
      images: vendor.imagePaths.map((path, index) => ({ path, url: vendorUrls[index][0] ?? null })),
      packages: packages.map((pkg, index) => ({ id: pkg.id, name: pkg.packageName, price: pkg.price, details: pkg.details ?? "",
        filters: pkg.filters ?? {},
        // The form refers to saved files by path, so it gets the paths here (admins and the vendor's own link only).
        attachments: pkg.attachments.map((file, i) => ({ ...file, url: attachmentUrls[index][i].url })) })),
    },
  };
}

/** The vendor's most recent submission link, if the listing came from one. */
export async function latestSubmissionLink(vendorId: number, executor: Pick<typeof db, "select"> = db) {
  const [link] = await executor.select({ id: vendorSubmissionLinks.id, state: vendorSubmissionLinks.state, label: vendorSubmissionLinks.label,
    vendorEmail: vendorSubmissionLinks.vendorEmail, fixNote: vendorSubmissionLinks.fixNote, expiresAt: vendorSubmissionLinks.expiresAt,
    submittedAt: vendorSubmissionLinks.submittedAt })
    .from(vendorSubmissionLinks).where(eq(vendorSubmissionLinks.vendorId, vendorId)).orderBy(desc(vendorSubmissionLinks.id)).limit(1);
  return link ?? null;
}

/** The admin edit page: the form data, review state, and the submission link it came from (if any). */
export async function getAdminVendor(id: number) {
  const { record, form } = await loadVendorForm(id);
  return {
    ...form,
    review: { status: record.status, note: record.reviewNote, reviewedAt: record.reviewedAt },
    submission: await latestSubmissionLink(id),
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

const attachmentKey = (attachments: StoredAttachment[]) => attachments.map((file) => file.path).join("\n");

/**
 * Saves an edit inside a transaction. Refuses (409) if the vendor's photos, packages or attachments changed since `before`
 * was loaded, so file cleanup never deletes a file another save has just started using.
 */
export async function applyVendorEdit(tx: Transaction, id: number, before: CurrentFiles,
  vendor: VendorInput & { imagePaths: string[] }, packages: PackageRecord[], deletedIds: number[]) {
  const [locked] = await tx.select({ imagePaths: vendorsTable.imagePaths }).from(vendorsTable).where(eq(vendorsTable.id, id)).for("update");
  if (!locked) throw new RequestError("Vendor not found", 404);
  const rows = await tx.select({ id: packagesTable.id, attachments: packagesTable.attachments }).from(packagesTable)
    .where(eq(packagesTable.vendorId, id)).orderBy(packagesTable.id);
  if (!sameList(locked.imagePaths, before.imagePaths) || !sameList(rows.map((row) => row.id), before.packages.map((pkg) => pkg.id))
    || !sameList(rows.map((row) => attachmentKey(row.attachments)), before.packages.map((pkg) => attachmentKey(pkg.attachments)))) {
    throw new RequestError("This vendor was changed by someone else. Reload the page and try again.", 409);
  }
  await tx.update(vendorsTable).set(vendor).where(eq(vendorsTable.id, id));
  if (deletedIds.length) await tx.delete(packagesTable).where(and(eq(packagesTable.vendorId, id), inArray(packagesTable.id, deletedIds)));
  for (const pkg of packages) {
    if (pkg.id === undefined) continue;
    const { id: packageId, ...values } = pkg;
    await tx.update(packagesTable).set(values).where(and(eq(packagesTable.id, packageId), eq(packagesTable.vendorId, id)));
  }
  const added = packages.filter((pkg) => pkg.id === undefined).map(({ id: _id, ...pkg }) => ({ ...pkg, vendorId: id }));
  if (added.length) await tx.insert(packagesTable).values(added);
}

/**
 * Approves or rejects a listing. The note is kept only for rejections (it explains why).
 * If the listing came from a submission link, the link is closed and a message for the vendor is returned to copy.
 */
export async function reviewAdminVendor(id: number, status: Exclude<VendorStatus, "pending">, note: string | null) {
  return db.transaction(async (tx) => {
    const [row] = await tx.update(vendorsTable)
      .set({ status, reviewNote: status === "rejected" ? note : null, reviewedAt: new Date() })
      .where(eq(vendorsTable.id, id))
      .returning({ status: vendorsTable.status, note: vendorsTable.reviewNote, reviewedAt: vendorsTable.reviewedAt, vendorName: vendorsTable.vendorName });
    if (!row) throw new RequestError("Vendor not found", 404);
    const closed = await tx.update(vendorSubmissionLinks).set({ state: "closed" })
      .where(and(eq(vendorSubmissionLinks.vendorId, id), inArray(vendorSubmissionLinks.state, ["open", "submitted", "reopened"])))
      .returning({ id: vendorSubmissionLinks.id });
    const fromLink = closed.length > 0 || (await latestSubmissionLink(id, tx)) !== null;
    const { vendorName, ...review } = row;
    const message = !fromLink ? null : status === "approved"
      ? vendorMessages.approved({ vendorName }) : vendorMessages.rejected({ vendorName, reason: note });
    return { review, message };
  });
}

/** Deletes the vendor and its packages, then their stored images (best effort, after the rows are gone). */
export async function deleteAdminVendor(id: number) {
  const paths = await db.transaction(async (tx) => {
    const [vendor] = await tx.select({ imagePaths: vendorsTable.imagePaths, filePath: vendorsTable.filePath }).from(vendorsTable)
      .where(eq(vendorsTable.id, id)).for("update");
    if (!vendor) throw new RequestError("Vendor not found", 404);
    const packages = await tx.delete(packagesTable).where(eq(packagesTable.vendorId, id)).returning({ attachments: packagesTable.attachments });
    await tx.delete(vendorsTable).where(eq(vendorsTable.id, id));
    return [...vendor.imagePaths, vendor.filePath, ...packages.flatMap((pkg) => pkg.attachments.map((file) => file.path))]
      .filter((path): path is string => !!path);
  });
  await removeStoredImagesQuietly(paths);
}
