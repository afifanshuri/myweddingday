import { UPLOAD_TYPES, type AttachmentKind, type UploadContentType, type UploadKind } from "@/config/uploads";

/** A file in the vendor form: already saved (has `path`) or a new upload (has `uploadId` once it finishes). */
export type UploadItem = {
  key: string;
  name: string;
  size: number | null;
  kind: AttachmentKind;
  status: "uploading" | "done" | "error";
  progress: number;
  error?: string;
  /** Saved file: its stored path and a short-lived link for previews. */
  path?: string;
  url?: string | null;
  /** New upload: the id the form sends when saving, a local preview for images, and the file (for Retry). */
  uploadId?: string;
  previewUrl?: string;
  file?: File;
};

/** What the save request sends for each file. */
export const fileRef = (item: UploadItem) => item.path ? { path: item.path } : { upload: item.uploadId! };

export const savedItem = (file: { path: string; name: string; kind: AttachmentKind; size: number | null; url: string | null }): UploadItem =>
  ({ key: file.path, name: file.name, size: file.size, kind: file.kind, status: "done", progress: 1, path: file.path, url: file.url });

export const contentTypeOf = (file: File): UploadContentType | null => Object.hasOwn(UPLOAD_TYPES, file.type) ? file.type as UploadContentType : null;

/** Shown when a file can't reach the server (no connection, dropped connection). Translated in the dictionaries' `errors`. */
export const UPLOAD_FAILED = "Upload failed. Check your connection and press Retry.";

/**
 * Uploads one file: asks `endpoint` for a one-time upload link, then sends the file straight to Storage.
 * Resolves with the upload id to save with the form.
 */
export async function uploadFile({ file, kind, endpoint, onProgress, signal }: {
  file: File; kind: UploadKind; endpoint: string; onProgress: (fraction: number) => void; signal: AbortSignal;
}): Promise<string> {
  // No connection: the browser's own error ("Failed to fetch") means nothing to people, so say what to do.
  const response = await fetch(endpoint, {
    method: "POST", signal, headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, fileName: file.name, contentType: file.type, size: file.size }),
  }).catch((cause: unknown) => { if (cause instanceof DOMException && cause.name === "AbortError") throw cause; throw new Error(UPLOAD_FAILED); });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Couldn't start the upload");
  const { uploadId, uploadUrl, contentType } = data as { uploadId: string; uploadUrl: string; contentType: string };

  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", uploadUrl);
    request.setRequestHeader("Content-Type", contentType);
    request.setRequestHeader("x-upsert", "false");
    request.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(event.loaded / event.total); };
    request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error(UPLOAD_FAILED));
    request.onerror = () => reject(new Error(UPLOAD_FAILED));
    request.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    signal.addEventListener("abort", () => request.abort(), { once: true });
    request.send(file);
  });
  return uploadId;
}
