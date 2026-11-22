import { requireAdmin, requireSameOrigin } from "@/services/others/adminAuthService";
import { privateJson } from "@/services/others/accountAccessService";
import { errorResponse, pathId, readJsonObject, requiredText } from "@/services/others/requestValidation";
import { requestSubmissionFixes } from "@/services/others/vendorSubmissionService";
import { SUBMISSION_LINK } from "@/config/submissionLinks";

type Context = { params: Promise<{ vendorId: string }> };

// "Please fix": reopens a pending submission with a note. Body: { note }. Returns a new link and a message to send.
export async function POST(request: Request, context: Context) {
  try {
    requireSameOrigin(request);
    await requireAdmin();
    const vendorId = pathId((await context.params).vendorId, "Vendor not found");
    const note = requiredText((await readJsonObject(request)).note, "What to change", SUBMISSION_LINK.fixNoteMax);
    return privateJson(await requestSubmissionFixes(vendorId, note, new URL(request.url).origin));
  } catch (error) { return errorResponse(error, "Unable to request changes"); }
}
