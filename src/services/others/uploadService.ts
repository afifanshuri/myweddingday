import "server-only";
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { pendingUploads } from "@/db/schema";
import { createAdminClient } from "@/utils/supabase/admin";
import { FILE_NAME_MAX, UNCLAIMED_UPLOAD_HOURS, UPLOAD_KINDS, UPLOAD_TYPES, type UploadContentType, type UploadKind } from "@/config/uploads";
import { RequestError } from "./requestValidation";
import { cleanFileName, detectFileType } from "./fileTypes";
import { removeStoredImagesQuietly } from "./vendorImageService";
import type { Transaction } from "./vendorAdminService";

const BUCKET = "assets";
/** Unsaved uploads one owner may have at once (a vendor form with many packages stays well below this). */
const MAX_UNCLAIMED = { admin: 300, link: 150 };

export type UploadOwner = `admin:${string}` | `link:${number}`;
export type VerifiedUpload = { id: string; path: string; name: string; kind: UploadKind; contentType: UploadContentType; size: number };

export function validateUploadRequest(value: Record<string, unknown>) {
  const kind = value.kind;
  if (kind !== "vendorImage" && kind !== "packageFile") throw new RequestError("Invalid upload type");
  const rules = UPLOAD_KINDS[kind];
  const contentType = value.contentType;
  if (typeof contentType !== "string" || !rules.types.includes(contentType as UploadContentType)) {
    throw new RequestError(kind === "vendorImage" ? "Photos must be JPG, PNG or WebP" : "Files must be JPG, PNG, WebP or PDF");
  }
  const size = value.size;
  if (typeof size !== "number" || !Number.isInteger(size) || size < 1 || size > rules.maxBytes) {
    throw new RequestError(`Files must be at most ${rules.maxBytes / 1024 / 1024} MB`);
  }
  if (typeof value.fileName !== "string") throw new RequestError("Missing file name");
  return { kind: kind as UploadKind, contentType: contentType as UploadContentType, size, fileName: cleanFileName(value.fileName, FILE_NAME_MAX) };
}

/**
 * Hands out a one-time Storage upload link (valid 2 hours, can't overwrite) for one new file, and records it as unclaimed.
 * Also removes old unclaimed uploads, so files from abandoned forms don't pile up.
 */
export async function issueUpload(owner: UploadOwner, request: ReturnType<typeof validateUploadRequest>) {
  await cleanupStaleUploads();
  const [{ unclaimed }] = await db.select({ unclaimed: sql<number>`count(*)::int` }).from(pendingUploads).where(eq(pendingUploads.owner, owner));
  if (unclaimed >= MAX_UNCLAIMED[owner.startsWith("admin:") ? "admin" : "link"]) {
    throw new RequestError("Too many files are waiting to be saved. Submit the form, or try again tomorrow.", 429);
  }
  const path = `${UPLOAD_KINDS[request.kind].folder}/${crypto.randomUUID()}.${UPLOAD_TYPES[request.contentType].extension}`;
  const { data, error } = await createAdminClient().storage.from(BUCKET).createSignedUploadUrl(path.slice(BUCKET.length + 1));
  if (error) throw new Error("Unable to prepare the upload");
  const [row] = await db.insert(pendingUploads).values({ owner, kind: request.kind, path, fileName: request.fileName,
    contentType: request.contentType, size: request.size }).returning({ id: pendingUploads.id });
  return { uploadId: row.id, uploadUrl: data.signedUrl, contentType: request.contentType };
}

/** Reads a stored file's real size and first bytes without downloading all of it. */
async function inspect(path: string) {
  const storage = createAdminClient().storage.from(BUCKET);
  const { data, error } = await storage.createSignedUrl(path.slice(BUCKET.length + 1), 60);
  if (error || !data) return null;
  const response = await fetch(data.signedUrl, { headers: { Range: "bytes=0-15" }, cache: "no-store" });
  if (!response.ok) return null;
  const bytes = new Uint8Array(await response.arrayBuffer());
  const total = Number(response.headers.get("content-range")?.split("/")[1] ?? (response.status === 200 ? bytes.length : NaN));
  return Number.isFinite(total) ? { bytes, size: total } : null;
}

/**
 * Checks uploads before they're saved into a listing: each must belong to `owner`, be of the expected kind, exist in Storage,
 * and really be an allowed type within the size limit. Throws a message naming the file otherwise.
 */
export async function verifyUploads(owner: UploadOwner, expected: Map<string, UploadKind>): Promise<Map<string, VerifiedUpload>> {
  const ids = [...expected.keys()];
  if (!ids.length) return new Map();
  if (ids.some((id) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id))) throw new RequestError("Invalid upload reference");
  const rows = await db.select().from(pendingUploads).where(and(eq(pendingUploads.owner, owner), inArray(pendingUploads.id, ids)));
  const byId = new Map(rows.map((row) => [row.id, row]));
  const missing = ids.filter((id) => !byId.has(id) || byId.get(id)!.kind !== expected.get(id));
  if (missing.length) throw new RequestError("Some uploaded files have expired. Remove them, upload them again, and save.", 409);

  const verified = new Map<string, VerifiedUpload>();
  // A few at a time, so a form with many files doesn't open dozens of connections at once.
  for (let start = 0; start < rows.length; start += 6) {
    await Promise.all(rows.slice(start, start + 6).map(async (row) => {
      const found = await inspect(row.path);
      if (!found) throw new RequestError(`"${row.fileName}" didn't finish uploading. Remove it and upload it again.`, 409);
      const type = detectFileType(found.bytes);
      const rules = UPLOAD_KINDS[row.kind];
      if (!type || !rules.types.includes(type)) throw new RequestError(`"${row.fileName}" isn't a ${row.kind === "vendorImage" ? "JPG, PNG or WebP photo" : "JPG, PNG, WebP or PDF file"}. Remove it and choose another file.`);
      if (found.size < 1 || found.size > rules.maxBytes) throw new RequestError(`"${row.fileName}" is larger than ${rules.maxBytes / 1024 / 1024} MB. Remove it and choose a smaller file.`);
      // The stored file must be the one the upload link was issued for.
      if (found.size !== row.size) throw new RequestError(`"${row.fileName}" didn't upload correctly. Remove it and upload it again.`);
      if (UPLOAD_TYPES[type].extension !== row.path.split(".").pop()) throw new RequestError(`"${row.fileName}" doesn't match its file type. Remove it and upload it again.`);
      verified.set(row.id, { id: row.id, path: row.path, name: row.fileName, kind: row.kind, contentType: type, size: found.size });
    }));
  }
  return verified;
}

/** Inside the save transaction: marks the uploads as saved. Fails if any was cleaned up meanwhile. */
export async function claimUploads(tx: Transaction, owner: UploadOwner, ids: string[]) {
  if (!ids.length) return;
  const claimed = await tx.delete(pendingUploads).where(and(eq(pendingUploads.owner, owner), inArray(pendingUploads.id, ids)))
    .returning({ id: pendingUploads.id });
  if (claimed.length !== new Set(ids).size) throw new RequestError("Some uploaded files have expired. Remove them, upload them again, and save.", 409);
}

/** Deletes uploads that were never saved into a listing (best effort, a batch at a time). */
export async function cleanupStaleUploads() {
  try {
    const cutoff = new Date(Date.now() - UNCLAIMED_UPLOAD_HOURS * 60 * 60 * 1000);
    const stale = await db.delete(pendingUploads).where(inArray(pendingUploads.id,
      db.select({ id: pendingUploads.id }).from(pendingUploads).where(lt(pendingUploads.createdAt, cutoff)).limit(100)))
      .returning({ path: pendingUploads.path });
    if (stale.length) await removeStoredImagesQuietly(stale.map((row) => row.path));
  } catch {
    console.error("Unable to clean up unsaved uploads");
  }
}
