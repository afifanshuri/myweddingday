import "server-only";
import { createAdminClient } from "@/utils/supabase/admin";
import { VENDOR_FILE_FOLDERS, type AttachmentView, type StoredAttachment } from "@/config/uploads";

export const IMAGE_LINK_SECONDS = 3600;
const BUCKET = "assets";

/** Storage key inside the bucket for a stored path, or null if the path isn't in a vendor file folder. */
const storageKey = (path: string) => VENDOR_FILE_FOLDERS.some((folder) => path.startsWith(`${folder}/`)) ? path.slice(BUCKET.length + 1) : null;

/** Signs stored files in one Storage request; returns one URL list per input list, in order. Unknown paths are dropped. */
async function signLists(pathLists: string[][]): Promise<(string | null)[][]> {
  const keys = [...new Set(pathLists.flat().map(storageKey).filter((key): key is string => key !== null))];
  if (!keys.length) return pathLists.map((paths) => paths.map(() => null));
  const { data, error } = await createAdminClient().storage.from(BUCKET).createSignedUrls(keys, IMAGE_LINK_SECONDS);
  if (error) {
    console.error("Unable to sign stored files");
    return pathLists.map((paths) => paths.map(() => null));
  }
  const signed = new Map(data.flatMap((file) => file.path && file.signedUrl ? [[file.path, file.signedUrl] as const] : []));
  return pathLists.map((paths) => paths.map((path) => signed.get(storageKey(path) ?? "") ?? null));
}

/** Signs photos for several vendors in one request; returns the working URLs per vendor, in order. */
export async function getVendorImageUrlsBatch(pathLists: string[][]): Promise<string[][]> {
  return (await signLists(pathLists)).map((urls) => urls.filter((url): url is string => url !== null));
}

/** Replaces each attachment's storage path with a short-lived link, for several packages in one request. */
export async function signAttachments(lists: StoredAttachment[][]): Promise<AttachmentView[][]> {
  const urls = await signLists(lists.map((attachments) => attachments.map((file) => file.path)));
  return lists.map((attachments, i) => attachments.map(({ name, kind, size }, j) => ({ name, kind, size, url: urls[i][j] })));
}

/** Deletes stored vendor files. Paths outside the vendor file folders are ignored. */
export async function removeStoredImages(paths: string[]) {
  const keys = [...new Set(paths.map(storageKey).filter((key): key is string => key !== null))];
  if (!keys.length) return;
  const { error } = await createAdminClient().storage.from(BUCKET).remove(keys);
  if (error) throw new Error("Unable to delete stored files");
}

/** Best-effort delete that never fails the caller. */
export async function removeStoredImagesQuietly(paths: string[]) {
  try { await removeStoredImages(paths); }
  catch { console.error("File cleanup failed; orphaned files require cleanup"); }
}
