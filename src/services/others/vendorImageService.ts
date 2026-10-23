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

export async function getVendorImageUrls(paths: string[]) {
  if (!paths.length) return [];
  const [bucket, folder] = ASSET_PATH.VENDOR.split("/");
  const safePaths = paths.filter((path) => path.startsWith(`${bucket}/${folder}/`))
    .map((path) => path.slice(bucket.length + 1));
  if (!safePaths.length) return [];
  const { data, error } = await createAdminClient().storage.from(bucket).createSignedUrls(safePaths, 3600);
  if (error) {
    console.error("Unable to load vendor images");
    return [];
  }
  return data.flatMap((image) => image.signedUrl ? [image.signedUrl] : []);
}
