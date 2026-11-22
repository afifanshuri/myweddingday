import { NextRequest } from "next/server";
import { requireAdmin, requireSameOrigin } from "@/services/others/adminAuthService";
import { errorResponse, readJsonObject } from "@/services/others/requestValidation";
import { saveVendorListing, validateVendorSave } from "@/services/others/vendorSaveService";
import { privateJson } from "@/services/others/accountAccessService";

// Admin create. Files are uploaded first (POST /api/admin/uploads) and referenced here by upload id.
// Customers read vendor data only through /api/match/vendors, which is scoped to the saved search
// and throttled. Admin listing and editing live under /api/admin/vendors. Do not add a bulk GET here.
export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const admin = await requireAdmin();
    const input = validateVendorSave(await readJsonObject(request, 256 * 1024));
    return privateJson(await saveVendorListing({ owner: `admin:${admin.id}`, vendorId: null, input, status: "approved" }), 201);
  } catch (e) {
    return errorResponse(e, "Failed to save vendor and packages");
  }
}
