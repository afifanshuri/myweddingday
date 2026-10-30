import { getAccountAccess, privateJson } from "@/services/others/accountAccessService";
import { getManualSearchUsage } from "@/services/others/manualSearchService";
import { errorResponse } from "@/services/others/requestValidation";

export async function GET() {
  try {
    return privateJson(await getManualSearchUsage(await getAccountAccess()));
  } catch (error) { return errorResponse(error, "Unable to load search allowance"); }
}
