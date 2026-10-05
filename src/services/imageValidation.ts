import { RequestError } from "./requestValidation";
export async function validateImage(file: File) {
  if (!file.size || file.size > 5 * 1024 * 1024) throw new RequestError("Images must be between 1 byte and 5 MB");
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte);
  const webp = new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF"
    && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  const extension = file.type === "image/jpeg" && jpeg ? "jpg"
    : file.type === "image/png" && png ? "png"
      : file.type === "image/webp" && webp ? "webp" : null;
  if (!extension) throw new RequestError("Only JPEG, PNG and WebP images are supported");
  return extension;
}

