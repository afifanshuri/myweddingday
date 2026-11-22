/**
 * Direct uploads: the browser asks the server for a one-time Storage upload link, uploads the file straight to Storage,
 * and the form then saves only a reference (the upload id). The server checks every file again before saving it.
 */
export const UPLOAD_TYPES = {
  "image/jpeg": { extension: "jpg", kind: "image" },
  "image/png": { extension: "png", kind: "image" },
  "image/webp": { extension: "webp", kind: "image" },
  "application/pdf": { extension: "pdf", kind: "pdf" },
} as const;
export type UploadContentType = keyof typeof UPLOAD_TYPES;
export type AttachmentKind = (typeof UPLOAD_TYPES)[UploadContentType]["kind"];

const MB = 1024 * 1024;
export const UPLOAD_KINDS = {
  /** Vendor photos: shown on result cards to everyone. */
  vendorImage: { folder: "assets/vendorImages", maxBytes: 5 * MB, types: ["image/jpeg", "image/png", "image/webp"] as UploadContentType[] },
  /** Package attachments: price lists, service details, anything. Plus users only. */
  packageFile: { folder: "assets/packageFiles", maxBytes: 10 * MB, types: ["image/jpeg", "image/png", "image/webp", "application/pdf"] as UploadContentType[] },
} as const;
export type UploadKind = keyof typeof UPLOAD_KINDS;

export const MAX_PACKAGE_ATTACHMENTS = 5;
export const FILE_NAME_MAX = 200;
/** Uploads not saved into a listing within this time are deleted. */
export const UNCLAIMED_UPLOAD_HOURS = 24;
/** Folders that hold vendor files; anything else is never signed or deleted. `packageImages` holds files from before attachments. */
export const VENDOR_FILE_FOLDERS = ["assets/vendorImages", "assets/packageImages", "assets/packageFiles"] as const;

/** A package attachment as stored. The path never leaves the server; customers get a short-lived `url` instead. */
export type StoredAttachment = { path: string; name: string; kind: AttachmentKind; size: number | null };
export type AttachmentView = { name: string; kind: AttachmentKind; size: number | null; url: string | null };

export const formatBytes = (bytes: number | null) => bytes === null ? ""
  : bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
