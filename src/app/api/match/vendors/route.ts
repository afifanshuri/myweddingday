import { NextRequest } from "next/server";
import { errorResponse, parseJson, readBody, validatePreferences } from "@/services/others/requestValidation";
import { getAccountAccess, privateJson } from "@/services/others/accountAccessService";
import { runManualSearch } from "@/services/others/manualSearchService";
import { requireSameOrigin } from "@/services/others/adminAuthService";

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
