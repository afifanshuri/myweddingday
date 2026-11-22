import { object, parseJson, readBody, RequestError } from "./requestValidation";
import { MAX_VENDOR_IMAGES } from "@/config/vendorImages";

export const VENDOR_FORM_MAX_BYTES = 25 * 1024 * 1024;

/**
 * Reads the vendor form (create and edit): a JSON `payload` field, up to MAX_VENDOR_IMAGES `vendorImages`
 * files, and one optional `file_<index>` per package. Any other or duplicated field is rejected.
 */
export async function readVendorForm(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    throw new RequestError("Send the vendor and packages together as multipart form data", 415);
  }
  const body = await readBody(request, VENDOR_FORM_MAX_BYTES);
  let form: FormData;
  try { form = await body.formData(); }
  catch { throw new RequestError("Invalid multipart form data"); }
  const payload = form.get("payload");
  if (typeof payload !== "string") throw new RequestError("Missing vendor/package payload");
  const data = object(parseJson(payload));
  const attachments = form.getAll("vendorImages");
  if (attachments.length > MAX_VENDOR_IMAGES || attachments.some((file) => !(file instanceof File))) {
    throw new RequestError(`Provide at most ${MAX_VENDOR_IMAGES} vendor images`);
  }
  const packageCount = Array.isArray(data.packages) ? Math.min(data.packages.length, 20) : 0;
  const files = Array.from({ length: packageCount }, (_, index) => {
    const file = form.get(`file_${index}`);
    if (file !== null && !(file instanceof File)) throw new RequestError("Invalid image attachment");
    return file;
  });
  for (const key of form.keys()) {
    if (key !== "payload" && key !== "vendorImages" && !files.some((_, index) => key === `file_${index}`)) {
      throw new RequestError("Unexpected form field");
    }
    if (key !== "vendorImages" && form.getAll(key).length !== 1) throw new RequestError("Duplicate form field");
  }
  return { data, files, vendorFiles: attachments as File[] };
}
