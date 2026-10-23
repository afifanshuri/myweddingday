import { validateImage } from "./imageValidation";
import { MAX_VENDOR_IMAGES } from "@/config/vendorImages";
import { RequestError } from "./requestValidation";
import type { validateVendor, validatePackages } from "./requestValidation";

type VendorInput = ReturnType<typeof validateVendor>;
type PackageInput = ReturnType<typeof validatePackages>[number];
type SaveRecords = (vendor: VendorInput & { imagePaths?: string[] }, packages: (PackageInput & { filePath?: string })[]) => Promise<{ id: number; vendorName: string }>;
// Dependencies let tests exercise failure cleanup without touching live services.
export async function createVendorWithPackages(
  vendor: VendorInput,
  packages: PackageInput[],
  files: (File | null)[],
  dependencies: {
    upload: (file: File, extension: string) => Promise<string>;
    uploadVendor?: (file: File, extension: string) => Promise<string>;
    remove: (paths: string[]) => Promise<void>;
    save: SaveRecords;
  },
  vendorFiles: File[] = [],
) {
  if (vendorFiles.length > MAX_VENDOR_IMAGES) throw new RequestError(`Upload at most ${MAX_VENDOR_IMAGES} vendor images`);
  const extensions = await Promise.all(files.map((file) => file ? validateImage(file) : null));
  const vendorExtensions = await Promise.all(vendorFiles.map(validateImage));
  const uploaded: string[] = [];
  try {
    const imagePaths: string[] = [];
    for (let index = 0; index < vendorFiles.length; index++) {
      if (!dependencies.uploadVendor) throw new Error("Vendor image storage is unavailable");
      const path = await dependencies.uploadVendor(vendorFiles[index], vendorExtensions[index]);
      uploaded.push(path);
      imagePaths.push(path);
    }
    const records = [];
    for (let index = 0; index < packages.length; index++) {
      const file = files[index];
      const filePath = file ? await dependencies.upload(file, extensions[index]!) : undefined;
      if (filePath) uploaded.push(filePath);
      records.push({ ...packages[index], filePath });
    }
    return await dependencies.save({ ...vendor, imagePaths }, records);
  } catch (error) {
    if (uploaded.length) {
      try { await dependencies.remove(uploaded); }
      catch { console.error("Image cleanup failed; orphaned uploads require cleanup"); }
    }
    throw error;
  }
}

