import { getAccountAccess, privateJson } from "@/services/others/accountAccessService";
import { requireSameOrigin } from "@/services/others/adminAuthService";
import { RequestError, errorResponse, readBody } from "@/services/others/requestValidation";
import { readShortlist, validateShortlistIds } from "@/services/others/shortlistService";

// Body: the shortlisted vendor ids (at most 30). Returns their current details as the user's access allows.
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    let ids: unknown;
    try { ids = await (await readBody(request, 2048)).json(); } catch (error) {
      if (error instanceof RequestError) throw error;
      throw new RequestError("Invalid shortlist");
    }
    return privateJson(await readShortlist(await getAccountAccess(), validateShortlistIds(ids)));
  } catch (error) { return errorResponse(error, "Unable to load your shortlist"); }
}
