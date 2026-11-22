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


export type PackageEdit = PackageInput & { id?: number; removeImage: boolean };
export type CurrentVendorFiles = { imagePaths: string[]; packages: { id: number; filePath: string | null }[] };
export type PackageRecord = PackageInput & { id?: number; filePath: string | null };

/**
 * Updates a vendor and its packages. Uploads new images first; if saving fails they are removed.
 * After a successful save, images that are no longer referenced are removed (best effort).
 * Packages missing from `packages` are deleted; entries without an id are new packages.
 */
export async function updateVendorWithPackages(
  current: CurrentVendorFiles,
  input: { vendor: VendorInput; packages: PackageEdit[]; files: (File | null)[]; keepImagePaths: string[]; vendorFiles: File[] },
  dependencies: {
    uploadVendor: (file: File, extension: string) => Promise<string>;
    uploadPackage: (file: File, extension: string) => Promise<string>;
    remove: (paths: string[]) => Promise<void>;
    save: (vendor: VendorInput & { imagePaths: string[] }, packages: PackageRecord[], deletedPackageIds: number[]) => Promise<void>;
  },
) {
  const keep = [...new Set(input.keepImagePaths)];
  if (keep.some((path) => !current.imagePaths.includes(path))) throw new RequestError("Unknown vendor image");
  if (keep.length + input.vendorFiles.length > MAX_VENDOR_IMAGES) throw new RequestError(`Keep at most ${MAX_VENDOR_IMAGES} vendor images`);
  const existing = new Map(current.packages.map((pkg) => [pkg.id, pkg]));
  const ids = input.packages.flatMap((pkg) => pkg.id === undefined ? [] : [pkg.id]);
  if (new Set(ids).size !== ids.length || ids.some((id) => !existing.has(id))) throw new RequestError("Unknown package");

  const extensions = await Promise.all(input.files.map((file) => file ? validateImage(file) : null));
  const vendorExtensions = await Promise.all(input.vendorFiles.map(validateImage));
  const uploaded: string[] = [];
  try {
    for (let index = 0; index < input.vendorFiles.length; index++) {
      uploaded.push(await dependencies.uploadVendor(input.vendorFiles[index], vendorExtensions[index]));
    }
    const imagePaths = [...keep, ...uploaded];
    const records: PackageRecord[] = [];
    for (let index = 0; index < input.packages.length; index++) {
      const { removeImage, ...pkg } = input.packages[index];
      const file = input.files[index];
      const previous = pkg.id === undefined ? null : existing.get(pkg.id)!.filePath;
      let filePath = removeImage ? null : previous;
      if (file) {
        filePath = await dependencies.uploadPackage(file, extensions[index]!);
        uploaded.push(filePath);
      }
      records.push({ ...pkg, filePath });
    }
    const deleted = current.packages.filter((pkg) => !ids.includes(pkg.id));
    await dependencies.save({ ...input.vendor, imagePaths }, records, deleted.map((pkg) => pkg.id));

    const stillUsed = new Set([...imagePaths, ...records.flatMap((pkg) => pkg.filePath ? [pkg.filePath] : [])]);
    const unused = [...current.imagePaths, ...current.packages.flatMap((pkg) => pkg.filePath ? [pkg.filePath] : [])]
      .filter((path) => !stillUsed.has(path));
    if (unused.length) {
      try { await dependencies.remove(unused); }
      catch { console.error("Image cleanup failed; orphaned uploads require cleanup"); }
    }
  } catch (error) {
    if (uploaded.length) {
      try { await dependencies.remove(uploaded); }
      catch { console.error("Image cleanup failed; orphaned uploads require cleanup"); }
    }
    throw error;
  }
}
