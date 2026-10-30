import { getVendorById } from "@/db/queries/vendors";
import { NextRequest } from "next/server";
import { privateJson, requireVendorAccess } from "@/services/others/accountAccessService";
import { errorResponse, positiveId } from "@/services/others/requestValidation";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireVendorAccess();
    const { id } = await params;
    return privateJson(await getVendorById(positiveId(Number(id))));
  } catch (error) { return errorResponse(error, "Unable to load vendor"); }
}
