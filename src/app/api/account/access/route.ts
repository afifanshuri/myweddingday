import { getAccountAccess, privateJson } from "@/services/others/accountAccessService";
import { errorResponse } from "@/services/others/requestValidation";

export async function GET() {
  try { return privateJson(await getAccountAccess()); }
  catch (error) { return errorResponse(error, "Unable to verify account access"); }
}
