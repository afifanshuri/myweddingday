import { createAdminClient } from "@/utils/supabase/admin";
import { ASSET_PATH } from "@/config/serviceCriteria";

export const IMAGE_LINK_SECONDS = 3600;

export function createVendorImageStorage() {
  const [bucket, folder] = ASSET_PATH.VENDOR.split("/");
  const storage = createAdminClient().storage.from(bucket);
  return {
    upload: async (file: File, extension: string) => {
      const { data, error } = await storage.upload(`${folder}/${crypto.randomUUID()}.${extension}`, file, { contentType: file.type });
      if (error) throw new Error("Unable to upload vendor image");
      return data.fullPath;
    },
  };
}

/** Signs images under one asset folder in one storage request; returns one URL list per input, in order. */
async function signImageLists(assetPath: string, pathLists: string[][]): Promise<string[][]> {
  const [bucket, folder] = assetPath.split("/");
  const safeLists = pathLists.map((paths) => paths.filter((path) => path.startsWith(`${bucket}/${folder}/`))
    .map((path) => path.slice(bucket.length + 1)));
  const unique = [...new Set(safeLists.flat())];
  if (!unique.length) return pathLists.map(() => []);
  const { data, error } = await createAdminClient().storage.from(bucket).createSignedUrls(unique, IMAGE_LINK_SECONDS);
  if (error) {
    console.error("Unable to load images");
    return pathLists.map(() => []);
  }
  const signed = new Map(data.flatMap((image) => image.path && image.signedUrl ? [[image.path, image.signedUrl] as const] : []));
  return safeLists.map((paths) => paths.flatMap((path) => signed.has(path) ? [signed.get(path)!] : []));
}

/** Signs images for several vendors in one storage request; returns one URL list per input, in order. */
export const getVendorImageUrlsBatch = (pathLists: string[][]) => signImageLists(ASSET_PATH.VENDOR, pathLists);

/** Signs one image per package (or none); returns a URL or null per input, in order. */
export async function getPackageImageUrls(paths: (string | null)[]): Promise<(string | null)[]> {
  const lists = await signImageLists(ASSET_PATH.PACKAGE, paths.map((path) => path ? [path] : []));
  return lists.map((urls) => urls[0] ?? null);
}

/** Deletes stored vendor and package images. Paths outside those two folders are ignored. */
export async function removeStoredImages(paths: string[]) {
  const [bucket] = ASSET_PATH.VENDOR.split("/");
  const allowed = [ASSET_PATH.VENDOR, ASSET_PATH.PACKAGE].map((path) => `${path}/`);
  const keys = [...new Set(paths.filter((path) => allowed.some((prefix) => path.startsWith(prefix))))]
    .map((path) => path.slice(bucket.length + 1));
  if (!keys.length) return;
  const { error } = await createAdminClient().storage.from(bucket).remove(keys);
  if (error) throw new Error("Unable to delete stored images");
}
