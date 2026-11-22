import { NextRequest } from "next/server";
import { requireAdmin, requireSameOrigin } from "@/services/others/adminAuthService";
import { errorResponse, validateVendor, validatePackages } from "@/services/others/requestValidation";
import { saveVendorSubmission } from "@/services/others/vendorCreationService";
import { readVendorForm } from "@/services/others/vendorFormParsing";
import { privateJson } from "@/services/others/accountAccessService";

// Customers read vendor data only through /api/match/vendors, which is scoped to the saved search
// and throttled. Admin listing and editing live under /api/admin/vendors. Do not add a bulk GET here.
export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    await requireAdmin();
    const { data, files, vendorFiles } = await readVendorForm(request);
    const vendor = validateVendor(data.vendor);
    const packages = validatePackages(data.packages, vendor.serviceId);
    const response = await saveVendorSubmission(vendor, packages, files, vendorFiles);
    return privateJson(response, 201);
  } catch (e) {
    return errorResponse(e, "Failed to save vendor and packages");
  }
}
