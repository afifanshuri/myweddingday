import { getAllVendorsByServiceIdArray } from "@/db/queries/vendors";
import { privateJson, requireVendorAccess } from "@/services/others/accountAccessService";
import { errorResponse, positiveId } from "@/services/others/requestValidation";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireVendorAccess();
    const { id } = await params;
    const result = await getAllVendorsByServiceIdArray([positiveId(Number(id))]);
    return privateJson(result);
  } catch (error) { return errorResponse(error, "Unable to load vendors"); }
}
