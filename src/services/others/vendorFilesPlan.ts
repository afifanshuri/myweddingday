import { MAX_PACKAGE_ATTACHMENTS, UPLOAD_TYPES, type StoredAttachment, type UploadContentType, type UploadKind } from "@/config/uploads";
import { MAX_VENDOR_IMAGES } from "@/config/vendorImages";
import { RequestError, object } from "./requestValidation";

/** A file in the form: one already saved (by its stored path) or a new upload (by its upload id). */
export type FileRef = { path: string } | { upload: string };
export type CurrentFiles = { imagePaths: string[]; packages: { id: number; attachments: StoredAttachment[] }[] };
type PackageFiles = { id?: number; attachments: FileRef[] };
type Upload = { path: string; name: string; contentType: UploadContentType; size: number };

export function validateFileRefs(value: unknown, max: number, label: string): FileRef[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > max) throw new RequestError(`At most ${max} ${label} are allowed`);
  return value.map((entry) => {
    const ref = object(entry);
    const keys = Object.keys(ref);
    if (keys.length === 1 && typeof ref.path === "string" && ref.path.length <= 255) return { path: ref.path };
    if (keys.length === 1 && typeof ref.upload === "string" && ref.upload.length <= 40) return { upload: ref.upload };
    throw new RequestError(`Invalid ${label} list`);
  });
}

/** Which upload ids the form uses and what each must be. Rejects an upload used twice. */
export function expectedUploads(images: FileRef[], packages: PackageFiles[]) {
  const expected = new Map<string, UploadKind>();
  const add = (ref: FileRef, kind: UploadKind) => {
    if (!("upload" in ref)) return;
    if (expected.has(ref.upload)) throw new RequestError("The same upload is used twice");
    expected.set(ref.upload, kind);
  };
  images.forEach((ref) => add(ref, "vendorImage"));
  packages.forEach((pkg) => pkg.attachments.forEach((ref) => add(ref, "packageFile")));
  return expected;
}

/**
 * Works out the vendor's final photos and each package's attachments, which packages are deleted, and which stored files
 * are no longer used (to delete after saving). Saved files can only be kept where they already are: a vendor photo stays a
 * vendor photo, and an attachment stays on its own package.
 */
export function planVendorFiles(current: CurrentFiles, images: FileRef[], packages: PackageFiles[], uploads: Map<string, Upload>) {
  if (images.length > MAX_VENDOR_IMAGES) throw new RequestError(`A vendor can have at most ${MAX_VENDOR_IMAGES} photos`);
  const seenPaths = new Set<string>();
  const keep = (path: string, allowed: string[], label: string) => {
    if (!allowed.includes(path) || seenPaths.has(path)) throw new RequestError(`Unknown ${label}. Reload the page and try again.`, 409);
    seenPaths.add(path);
    return path;
  };
  const upload = (id: string) => {
    const found = uploads.get(id);
    if (!found) throw new RequestError("Some uploaded files have expired. Remove them, upload them again, and save.", 409);
    return found;
  };

  const imagePaths = images.map((ref) => "path" in ref ? keep(ref.path, current.imagePaths, "vendor photo") : upload(ref.upload).path);

  const existing = new Map(current.packages.map((pkg) => [pkg.id, pkg]));
  const ids = packages.flatMap((pkg) => pkg.id === undefined ? [] : [pkg.id]);
  if (new Set(ids).size !== ids.length || ids.some((id) => !existing.has(id))) throw new RequestError("Unknown package. Reload the page and try again.", 409);

  const attachments = packages.map((pkg): StoredAttachment[] => {
    if (pkg.attachments.length > MAX_PACKAGE_ATTACHMENTS) throw new RequestError(`A package can have at most ${MAX_PACKAGE_ATTACHMENTS} attachments`);
    const saved = pkg.id === undefined ? [] : existing.get(pkg.id)!.attachments;
    return pkg.attachments.map((ref) => {
      if ("path" in ref) {
        const path = keep(ref.path, saved.map((file) => file.path), "attachment");
        return saved.find((file) => file.path === path)!;
      }
      const file = upload(ref.upload);
      return { path: file.path, name: file.name, kind: UPLOAD_TYPES[file.contentType].kind, size: file.size };
    });
  });

  const stillUsed = new Set([...imagePaths, ...attachments.flat().map((file) => file.path)]);
  const removed = [...current.imagePaths, ...current.packages.flatMap((pkg) => pkg.attachments.map((file) => file.path))]
    .filter((path) => !stillUsed.has(path));
  const deletedPackageIds = current.packages.map((pkg) => pkg.id).filter((id) => !ids.includes(id));
  return { imagePaths, attachments, deletedPackageIds, removed: [...new Set(removed)] };
}
