import {
  getAllVendorsByServiceIdArray,
} from "@/db/queries/vendors";
import { VendorType } from "@/types/dataTypes";
import { NextRequest } from "next/server";
import { requireAdmin, requireSameOrigin } from "@/services/others/adminAuthService";
import { errorResponse, object, parseJson, positiveId, readBody, RequestError, validateVendor, validatePackages } from "@/services/others/requestValidation";
import { saveVendorSubmission } from "@/services/others/vendorCreationService";
import { MAX_VENDOR_IMAGES } from "@/config/vendorImages";
import { privateJson, requireVendorAccess } from "@/services/others/accountAccessService";

export async function GET(request: NextRequest) {
  try {
    await requireVendorAccess();
    let result: VendorType[] = [];
    const serviceId = request.nextUrl.searchParams.get("serviceIds");
    if (!serviceId || serviceId.length === 0) {
      return privateJson([]);
    } else {
      const ids = serviceId.split(",");
      if (ids.length > 6) throw new RequestError("Choose at most six services");
      result = await getAllVendorsByServiceIdArray([...new Set(ids.map((id) => positiveId(Number(id))))]);
    }
    return privateJson(result);
  } catch (error) { return errorResponse(error, "Unable to load vendors"); }
}

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    await requireAdmin();
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) {
      throw new RequestError("Send the vendor and packages together as multipart form data", 415);
    }
    const body = await readBody(request, 25 * 1024 * 1024);
    let form: FormData;
    try { form = await body.formData(); }
    catch { throw new RequestError("Invalid multipart form data"); }
    const payload = form.get("payload");
    if (typeof payload !== "string") throw new RequestError("Missing vendor/package payload");
    const data = object(parseJson(payload));
    const vendor = validateVendor(data.vendor);
    const packages = validatePackages(data.packages, vendor.serviceId);
    const attachments = form.getAll("vendorImages");
    if (attachments.length > MAX_VENDOR_IMAGES || attachments.some((file) => !(file instanceof File))) {
      throw new RequestError(`Provide at most ${MAX_VENDOR_IMAGES} vendor images`);
    }
    const vendorFiles = attachments as File[];
    const files = packages.map((_, index) => {
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
    const response = await saveVendorSubmission(vendor, packages, files, vendorFiles);
    return privateJson(response, 201);
  } catch (e) {
    return errorResponse(e, "Failed to save vendor and packages");
  }
}
