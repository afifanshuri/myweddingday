import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { vendorSubmissionLinks, vendorsTable } from "@/db/schema";
import { SUBMISSION_LINK, SUBMISSION_TOKEN_PATTERN, vendorSubmitRoute, type SubmissionLinkState } from "@/config/submissionLinks";
import { RequestError } from "./requestValidation";
import { loadVendorForm, type Transaction } from "./vendorAdminService";
import { saveVendorListing, type VendorSaveInput } from "./vendorSaveService";
import { issueUpload, type validateUploadRequest } from "./uploadService";
import { vendorMessages } from "./vendorMessages";

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

/** A one-time upload link for a file in the vendor's form. Uploads belong to the submission link, not to any user. */
export async function issueUploadForLink(token: string, request: ReturnType<typeof validateUploadRequest>) {
  const link = await usableLink(token);
  return { linkId: link.id, upload: await issueUpload(`link:${link.id}`, request) };
}

/** Which link a request is for (checked before reading a large body). */
export async function submissionLinkId(token: string) {
  return (await usableLink(token)).id;
}

/**
 * Saves the vendor's submission as pending: a new listing for an open link, or edits to their saved listing for a reopened one.
 * The link row is locked and checked again inside the save transaction, so a double submit or a link cancelled meanwhile fails.
 * Uploads stay available after a failed save, so the vendor can just submit again.
 */
export async function submitByToken(token: string, input: VendorSaveInput) {
  const link = await usableLink(token);
  if (link.state === "reopened" && link.vendorId === null) throw new RequestError("This submission no longer exists. Please contact us for a new link.", 410);
  const recheck = async (tx: Transaction) => {
    const current = await usableLink(token, tx, true);
    if (current.id !== link.id || current.state !== link.state || current.tokenHash !== link.tokenHash) {
      throw new RequestError("This link changed while you were submitting. Reload the page and try again.", 409);
    }
    if (link.vendorId !== null) {
      const [vendor] = await tx.select({ status: vendorsTable.status }).from(vendorsTable).where(eq(vendorsTable.id, link.vendorId));
      if (vendor?.status !== "pending") throw new RequestError(UNUSABLE.closed, 410);
    }
  };
  await saveVendorListing({
    owner: `link:${link.id}`, vendorId: link.state === "open" ? null : link.vendorId, input, status: "pending", inTransaction: recheck,
    afterSave: async (tx, vendorId) => {
      await tx.update(vendorSubmissionLinks).set({ state: "submitted", vendorId, submittedAt: new Date() })
        .where(eq(vendorSubmissionLinks.id, link.id));
    },
  });
  return { message: vendorMessages.received() };
}
