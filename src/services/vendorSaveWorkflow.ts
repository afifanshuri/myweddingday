import { validateImage } from "./imageValidation";
import type { validateVendor, validatePackages } from "./requestValidation";

type VendorInput = ReturnType<typeof validateVendor>;
type PackageInput = ReturnType<typeof validatePackages>[number];
type SaveRecords = (vendor: VendorInput, packages: (PackageInput & { filePath?: string })[]) => Promise<{ id: number; vendorName: string }>;
// Dependencies let tests exercise failure cleanup without touching live services.
export async function createVendorWithPackages(
  vendor: VendorInput,
  packages: PackageInput[],
  files: (File | null)[],
  dependencies: {
    upload: (file: File, extension: string) => Promise<string>;
    remove: (paths: string[]) => Promise<void>;
    save: SaveRecords;
  },
) {
  const extensions = await Promise.all(files.map((file) => file ? validateImage(file) : null));
  const uploaded: string[] = [];
  try {
    const records = [];
    for (let index = 0; index < packages.length; index++) {
      const file = files[index];
      const filePath = file ? await dependencies.upload(file, extensions[index]!) : undefined;
      if (filePath) uploaded.push(filePath);
      records.push({ ...packages[index], filePath });
    }
    return await dependencies.save(vendor, records);
  } catch (error) {
    if (uploaded.length) {
      try { await dependencies.remove(uploaded); }
      catch { console.error("Package image cleanup failed; orphaned uploads require cleanup"); }
    }
    throw error;
  }
}

