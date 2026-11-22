import { requireAdmin, requireSameOrigin } from "@/services/others/adminAuthService";
import { privateJson } from "@/services/others/accountAccessService";
import { errorResponse, readJsonObject, RequestError } from "@/services/others/requestValidation";
import { deleteAdminVendor, getAdminVendor } from "@/services/others/vendorAdminService";
import { saveVendorListing, validateVendorSave } from "@/services/others/vendorSaveService";

type Context = { params: Promise<{ vendorId: string }> };

async function vendorId(context: Context) {
  const { vendorId } = await context.params;
  if (!/^[1-9]\d{0,9}$/.test(vendorId) || Number(vendorId) > 2147483647) throw new RequestError("Vendor not found", 404);
  return Number(vendorId);
}

export async function GET(_request: Request, context: Context) {
  try {
    await requireAdmin();
    return privateJson(await getAdminVendor(await vendorId(context)));
  } catch (error) { return errorResponse(error, "Unable to load vendor"); }
}

export async function PUT(request: Request, context: Context) {
  try {
    requireSameOrigin(request);
    const admin = await requireAdmin();
    const id = await vendorId(context);
    const input = validateVendorSave(await readJsonObject(request, 256 * 1024));
    return privateJson(await saveVendorListing({ owner: `admin:${admin.id}`, vendorId: id, input }));
  } catch (error) { return errorResponse(error, "Unable to update vendor"); }
}

export async function DELETE(request: Request, context: Context) {
  try {
    requireSameOrigin(request);
    await requireAdmin();
    await deleteAdminVendor(await vendorId(context));
    return privateJson({ deleted: true });
  } catch (error) { return errorResponse(error, "Unable to delete vendor"); }
}
