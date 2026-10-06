import {
  getAllVendorsByServiceIdArray,
} from "@/db/queries/vendors";
import { VendorType } from "@/types/dataTypes";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireSameOrigin } from "@/services/others/adminAuthService";
import { errorResponse, object, parseJson, readBody, RequestError, validateVendor, validatePackages } from "@/services/others/requestValidation";
import { saveVendorSubmission } from "@/services/others/vendorCreationService";

export async function GET(request: NextRequest) {
  let result: VendorType[] = [];
  const serviceId = request.nextUrl.searchParams.get("serviceIds");
  if (!serviceId || serviceId.length === 0) {
    return Response.json([]);
  } else if (serviceId.length === 1) {
    result = await getAllVendorsByServiceIdArray([Number(serviceId)]);
  } else {
    result = await getAllVendorsByServiceIdArray(
      serviceId.split(",").map(Number),
    );
  }
  return Response.json(result);
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
    const files = packages.map((_, index) => {
      const file = form.get(`file_${index}`);
      if (file !== null && !(file instanceof File)) throw new RequestError("Invalid image attachment");
      return file;
    });
    for (const key of form.keys()) {
      if (key !== "payload" && !files.some((_, index) => key === `file_${index}`)) {
        throw new RequestError("Unexpected form field");
      }
      if (form.getAll(key).length !== 1) throw new RequestError("Duplicate form field");
    }
    const response = await saveVendorSubmission(vendor, packages, files);
    return NextResponse.json(response, { status: 201 });
  } catch (e) {
    return errorResponse(e, "Failed to save vendor and packages");
  }
}
