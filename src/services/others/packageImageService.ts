import { createAdminClient } from "@/utils/supabase/admin";
import { ASSET_PATH } from "@/config/serviceCriteria";


export function createPackageImageStorage() {
  const supabase = createAdminClient();
  const [bucket, ...folders] = ASSET_PATH.PACKAGE.split("/");
  const storage = supabase.storage.from(bucket);
  return {
    upload: async (file: File, extension: string) => {
      const path = [...folders, `${crypto.randomUUID()}.${extension}`].join("/");
      const { data, error } = await storage.upload(path, file, { contentType: file.type });
      if (error) throw new Error("Unable to upload package image");
      return data.fullPath;
    },
    remove: async (paths: string[]) => {
      const { error } = await storage.remove(paths.map((path) => path.slice(bucket.length + 1)));
      if (error) throw new Error("Unable to clean up package images");
    },
  };
}
