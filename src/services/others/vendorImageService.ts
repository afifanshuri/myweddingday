import { createAdminClient } from "@/utils/supabase/admin";
import { ASSET_PATH } from "@/config/serviceCriteria";

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

/** Signs images for several vendors in one storage request; returns one URL list per input, in order. */
export async function getVendorImageUrlsBatch(pathLists: string[][]): Promise<string[][]> {
  const [bucket, folder] = ASSET_PATH.VENDOR.split("/");
  const safeLists = pathLists.map((paths) => paths.filter((path) => path.startsWith(`${bucket}/${folder}/`))
    .map((path) => path.slice(bucket.length + 1)));
  const unique = [...new Set(safeLists.flat())];
  if (!unique.length) return pathLists.map(() => []);
  const { data, error } = await createAdminClient().storage.from(bucket).createSignedUrls(unique, 3600);
  if (error) {
    console.error("Unable to load vendor images");
    return pathLists.map(() => []);
  }
  const signed = new Map(data.flatMap((image) => image.path && image.signedUrl ? [[image.path, image.signedUrl] as const] : []));
  return safeLists.map((paths) => paths.flatMap((path) => signed.has(path) ? [signed.get(path)!] : []));
}
