import { NextRequest } from "next/server";
import { errorResponse, parseJson, readBody, validatePreferences } from "@/services/others/requestValidation";
import { getAccountAccess, privateJson } from "@/services/others/accountAccessService";
import { runManualSearch, readManualSearch, readManualSearchVendor } from "@/services/others/manualSearchService";
import { requireSameOrigin } from "@/services/others/adminAuthService";

export async function GET(request: NextRequest) {
  try {
    const access = await getAccountAccess();
    const searchId = request.nextUrl.searchParams.get("searchId") ?? "";
    const vendorId = request.nextUrl.searchParams.get("vendorId");
    const serviceId = request.nextUrl.searchParams.get("serviceId");
    const result = vendorId !== null
      ? await readManualSearchVendor(access, searchId, Number(vendorId))
      : await readManualSearch(access, searchId, Number(request.nextUrl.searchParams.get("page") ?? 1), true, serviceId === null ? null : Number(serviceId));
    return privateJson(result);
  } catch (error) { return errorResponse(error, "Unable to load saved results"); }
}

export async function POST(data: NextRequest) {
  try {
    requireSameOrigin(data);
    const access = await getAccountAccess();
    const body = await readBody(data, 64 * 1024);
    const preferencesList = validatePreferences(parseJson(await body.text()));
    const result = await runManualSearch(access, data.headers.get("Idempotency-Key") ?? "", preferencesList);
    return privateJson(result);
  } catch (error) {
    return errorResponse(error, "Failed to retrieve vendors");
  }
}
