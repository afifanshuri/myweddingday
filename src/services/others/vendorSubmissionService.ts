import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { packagesTable, vendorSubmissionLinks, vendorsTable } from "@/db/schema";
import { SUBMISSION_LINK, SUBMISSION_TOKEN_PATTERN, vendorSubmitRoute, type SubmissionLinkState } from "@/config/submissionLinks";
import { RequestError, type validatePackages, type validateVendor } from "./requestValidation";
import { createVendorWithPackages, updateVendorWithPackages, type PackageEdit } from "./vendorSaveWorkflow";
import { applyVendorEdit, assertCatalogueIds, currentVendorFiles, loadVendorForm, vendorEditStorage } from "./vendorAdminService";
import { vendorMessages } from "./vendorMessages";

type VendorInput = ReturnType<typeof validateVendor>;
type PackageInput = ReturnType<typeof validatePackages>[number];

const newToken = () => randomBytes(32).toString("base64url");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const expiry = () => new Date(Date.now() + SUBMISSION_LINK.lifetimeDays * 24 * 60 * 60 * 1000);
const linkUrl = (origin: string, token: string) => new URL(vendorSubmitRoute(token), origin).toString();

// ---------- Admin ----------

export async function createSubmissionLink(input: { label: string; vendorEmail: string | null; adminId: string; origin: string }) {
  const token = newToken();
  const [link] = await db.insert(vendorSubmissionLinks).values({
    tokenHash: hashToken(token), label: input.label, vendorEmail: input.vendorEmail, createdBy: input.adminId, expiresAt: expiry(),
  }).returning();
  const url = linkUrl(input.origin, token);
  return { link: summary(link), url, message: vendorMessages.invite({ label: link.label, url, expiresAt: link.expiresAt }) };
}

function summary(link: typeof vendorSubmissionLinks.$inferSelect & { vendorName?: string | null }) {
  return { id: link.id, label: link.label, vendorEmail: link.vendorEmail, state: link.state, createdAt: link.createdAt,
    expiresAt: link.expiresAt, submittedAt: link.submittedAt, vendorId: link.vendorId, vendorName: link.vendorName ?? null,
    expired: (link.state === "open" || link.state === "reopened") && link.expiresAt.getTime() <= Date.now() };
}

/** The 100 most recent links, newest first. */
export async function listSubmissionLinks() {
  const rows = await db.select({ link: vendorSubmissionLinks, vendorName: vendorsTable.vendorName }).from(vendorSubmissionLinks)
    .leftJoin(vendorsTable, eq(vendorsTable.id, vendorSubmissionLinks.vendorId))
    .orderBy(desc(vendorSubmissionLinks.createdAt), desc(vendorSubmissionLinks.id)).limit(100);
  return rows.map(({ link, vendorName }) => summary({ ...link, vendorName }));
}

/** Cancels a link that still works. A reopened link goes back to "submitted" (the listing stays in the queue). */
export async function cancelSubmissionLink(id: number) {
  return db.transaction(async (tx) => {
    const [link] = await tx.select().from(vendorSubmissionLinks).where(eq(vendorSubmissionLinks.id, id)).for("update");
    if (!link) throw new RequestError("Link not found", 404);
    if (link.state !== "open" && link.state !== "reopened") throw new RequestError("This link is no longer active", 409);
    const [updated] = await tx.update(vendorSubmissionLinks).set({ state: link.state === "open" ? "cancelled" : "submitted" })
      .where(eq(vendorSubmissionLinks.id, id)).returning();
    return summary(updated);
  });
}

/**
 * "Please fix": reopens a pending listing's submission with the admin's note and a new link (the old one stops working,
 * since only a hash is stored). Returns the link and a message to send the vendor.
 */
export async function requestSubmissionFixes(vendorId: number, note: string, origin: string) {
  const token = newToken();
  const result = await db.transaction(async (tx) => {
    const [vendor] = await tx.select({ status: vendorsTable.status, vendorName: vendorsTable.vendorName }).from(vendorsTable)
      .where(eq(vendorsTable.id, vendorId)).for("update");
    if (!vendor) throw new RequestError("Vendor not found", 404);
    if (vendor.status !== "pending") throw new RequestError("Only listings waiting for review can be sent back for fixes", 409);
    const [link] = await tx.select().from(vendorSubmissionLinks)
      .where(and(eq(vendorSubmissionLinks.vendorId, vendorId), inArray(vendorSubmissionLinks.state, ["submitted", "reopened"])))
      .orderBy(desc(vendorSubmissionLinks.id)).limit(1).for("update");
    if (!link) throw new RequestError("This listing didn't come from a submission link", 409);
    const [updated] = await tx.update(vendorSubmissionLinks)
      .set({ tokenHash: hashToken(token), state: "reopened", fixNote: note, expiresAt: expiry() })
      .where(eq(vendorSubmissionLinks.id, link.id)).returning();
    return { link: updated, vendorName: vendor.vendorName };
  });
  const url = linkUrl(origin, token);
  return {
    submission: { id: result.link.id, state: result.link.state, label: result.link.label, vendorEmail: result.link.vendorEmail,
      fixNote: result.link.fixNote, expiresAt: result.link.expiresAt, submittedAt: result.link.submittedAt },
    url,
    message: vendorMessages.fixRequested({ vendorName: result.vendorName, note, url, expiresAt: result.link.expiresAt }),
  };
}

// ---------- Vendor (public, by token) ----------

const UNUSABLE: Record<Exclude<SubmissionLinkState, "open" | "reopened">, string> = {
  submitted: "Your listing has already been submitted. We'll contact you after reviewing it.",
  closed: "Your listing has already been reviewed, so this link no longer works.",
  cancelled: "This link has been cancelled. Please contact us for a new one.",
};

/** Finds a usable link, or throws a message the vendor can understand. Pass a transaction to lock the row. */
async function usableLink(token: string, executor: Pick<typeof db, "select"> = db, lock = false) {
  if (!SUBMISSION_TOKEN_PATTERN.test(token)) throw new RequestError("This link isn't valid. Please check you copied all of it.", 404);
  const query = executor.select().from(vendorSubmissionLinks).where(eq(vendorSubmissionLinks.tokenHash, hashToken(token)));
  const [link] = lock ? await query.for("update") : await query;
  if (!link) throw new RequestError("This link isn't valid. It may have been replaced by a newer link.", 404);
  if (link.state !== "open" && link.state !== "reopened") throw new RequestError(UNUSABLE[link.state], 410);
  if (link.expiresAt.getTime() <= Date.now()) throw new RequestError("This link has expired. Please contact us for a new one.", 410);
  return link;
}

/** What the vendor's form needs: a blank form for a new link, or their saved submission (with the admin's note) when reopened. */
export async function readSubmission(token: string) {
  const link = await usableLink(token);
  const base = { label: link.label, expiresAt: link.expiresAt, fixNote: link.state === "reopened" ? link.fixNote : null };
  if (link.state === "open") return { ...base, saved: null };
  if (link.vendorId === null) throw new RequestError("This submission no longer exists. Please contact us for a new link.", 410);
  const { form } = await loadVendorForm(link.vendorId);
  return { ...base, saved: form };
}

type NewSubmission = { kind: "new"; vendor: VendorInput; packages: PackageInput[]; files: (File | null)[]; vendorFiles: File[] };
type EditedSubmission = { kind: "edit"; vendor: VendorInput; packages: PackageEdit[]; files: (File | null)[]; vendorFiles: File[]; keepImagePaths: string[] };

/** Which kind of payload this link expects: a new listing, or edits to the saved one. */
export async function submissionKind(token: string) {
  const link = await usableLink(token);
  return { kind: link.state === "open" ? "new" as const : "edit" as const, linkId: link.id };
}

/**
 * Saves the vendor's submission as pending. Images are uploaded first; the link row is locked and checked again inside the
 * save transaction, so a double submit or a link cancelled meanwhile fails (and the new uploads are removed).
 */
export async function submitByToken(token: string, input: NewSubmission | EditedSubmission) {
  await assertCatalogueIds(input.vendor);
  const link = await usableLink(token);
  const expected = { id: link.id, state: link.state, tokenHash: link.tokenHash };
  const recheck = async (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => {
    const current = await usableLink(token, tx, true);
    if (current.id !== expected.id || current.state !== expected.state || current.tokenHash !== expected.tokenHash) {
      throw new RequestError("This link changed while you were submitting. Reload the page and try again.", 409);
    }
  };

  if (input.kind === "new") {
    if (link.state !== "open") throw new RequestError("Reload the page: your saved listing has been reopened for changes.", 409);
    const storage = vendorEditStorage();
    await createVendorWithPackages(input.vendor, input.packages, input.files, {
      upload: storage.uploadPackage, uploadVendor: storage.uploadVendor, remove: storage.remove,
      save: (vendor, packages) => db.transaction(async (tx) => {
        await recheck(tx);
        const [created] = await tx.insert(vendorsTable).values({ ...vendor, status: "pending" })
          .returning({ id: vendorsTable.id, vendorName: vendorsTable.vendorName });
        await tx.insert(packagesTable).values(packages.map((pkg) => ({ ...pkg, vendorId: created.id })));
        await tx.update(vendorSubmissionLinks).set({ state: "submitted", vendorId: created.id, submittedAt: new Date() })
          .where(eq(vendorSubmissionLinks.id, link.id));
        return created;
      }),
    }, input.vendorFiles);
  } else {
    if (link.state !== "reopened" || link.vendorId === null) throw new RequestError("Reload the page and try again.", 409);
    const vendorId = link.vendorId;
    const before = await currentVendorFiles(vendorId);
    await updateVendorWithPackages(before, input, {
      ...vendorEditStorage(),
      save: (vendor, packages, deletedIds) => db.transaction(async (tx) => {
        await recheck(tx);
        const [status] = await tx.select({ status: vendorsTable.status }).from(vendorsTable).where(eq(vendorsTable.id, vendorId));
        if (status?.status !== "pending") throw new RequestError(UNUSABLE.closed, 410);
        await applyVendorEdit(tx, vendorId, before, vendor, packages, deletedIds);
        await tx.update(vendorSubmissionLinks).set({ state: "submitted", submittedAt: new Date() })
          .where(eq(vendorSubmissionLinks.id, link.id));
      }),
    });
  }
  return { message: vendorMessages.received() };
}
