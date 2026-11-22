import { requireAdmin, requireSameOrigin } from "@/services/others/adminAuthService";
import { privateJson } from "@/services/others/accountAccessService";
import { errorResponse, pathId } from "@/services/others/requestValidation";
import { cancelSubmissionLink } from "@/services/others/vendorSubmissionService";

type Context = { params: Promise<{ linkId: string }> };

// Cancels a link that still works.
export async function DELETE(request: Request, context: Context) {
  try {
    requireSameOrigin(request);
    await requireAdmin();
    return privateJson(await cancelSubmissionLink(pathId((await context.params).linkId, "Link not found")));
  } catch (error) { return errorResponse(error, "Unable to cancel link"); }
}
