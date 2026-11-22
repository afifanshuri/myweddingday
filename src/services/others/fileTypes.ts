import type { UploadContentType } from "@/config/uploads";

/** Identifies an allowed file from its first bytes (its signature), regardless of its name or declared type. */
export function detectFileType(bytes: Uint8Array): UploadContentType | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte)) return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(0, 5) === "%PDF-") return "application/pdf";
  return null;
}

/** A file name that is safe to show and to use in a download: no folders, control characters or very long names. */
export function cleanFileName(value: string, max: number) {
  const base = value.split(/[\\/]/).pop() ?? "";
  // eslint-disable-next-line no-control-regex
  const cleaned = base.replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "").replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned || "file";
  const dot = cleaned.lastIndexOf(".");
  const extension = dot > 0 && cleaned.length - dot <= 10 ? cleaned.slice(dot) : "";
  return cleaned.slice(0, max - extension.length) + extension;
}
