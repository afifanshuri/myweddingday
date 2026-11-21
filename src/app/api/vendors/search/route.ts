import { NextRequest } from "next/server";
import { privateJson, requireVendorAccess } from "@/services/others/accountAccessService";
import { lookupVendorsByName } from "@/services/others/vendorLookupService";
import { errorResponse } from "@/services/others/requestValidation";

// Plus/admin only: GET /api/vendors/search?q=<name>
export async function GET(request: NextRequest) {
  try {
    const access = await requireVendorAccess();
    return privateJson(await lookupVendorsByName(access, request.nextUrl.searchParams.get("q")));
  } catch (error) { return errorResponse(error, "Unable to search vendors"); }
}
