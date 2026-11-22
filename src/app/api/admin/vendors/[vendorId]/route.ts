import { requireAdmin, requireSameOrigin } from "@/services/others/adminAuthService";
import { privateJson } from "@/services/others/accountAccessService";
import { errorResponse, RequestError, validatePackageEdits, validateVendor } from "@/services/others/requestValidation";
import { readVendorForm } from "@/services/others/vendorFormParsing";
import { deleteAdminVendor, getAdminVendor, updateAdminVendor } from "@/services/others/vendorAdminService";

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
    await requireAdmin();
    const id = await vendorId(context);
    const { data, files, vendorFiles } = await readVendorForm(request);
    const vendor = validateVendor(data.vendor);
    const packages = validatePackageEdits(data.packages, vendor.serviceId);
    const keep = data.keepImagePaths ?? [];
    if (!Array.isArray(keep) || keep.some((path) => typeof path !== "string")) throw new RequestError("Invalid image list");
    return privateJson(await updateAdminVendor(id, { vendor, packages, files, keepImagePaths: keep as string[], vendorFiles }));
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
