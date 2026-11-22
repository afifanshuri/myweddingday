import { requireSameOrigin } from "@/services/others/adminAuthService";
import { privateJson } from "@/services/others/accountAccessService";
import { errorResponse, readJsonObject } from "@/services/others/requestValidation";
import { clientAddressKey, limitPerHour } from "@/services/others/publicRateLimit";
import { readSubmission, submissionLinkId, submitByToken } from "@/services/others/vendorSubmissionService";
import { validateVendorSave } from "@/services/others/vendorSaveService";
import { SUBMISSION_LINK } from "@/config/submissionLinks";

// Public: vendors open and submit their listing from a link; the token in the path is the only credential.
// Files are uploaded first (POST ./uploads) and referenced here by upload id.
type Context = { params: Promise<{ token: string }> };

export async function GET(request: Request, context: Context) {
  try {
    await limitPerHour(`view:${clientAddressKey(request)}`, SUBMISSION_LINK.viewsPerIpPerHour);
    return privateJson(await readSubmission((await context.params).token));
  } catch (error) { return errorResponse(error, "Unable to open this link"); }
}

export async function POST(request: Request, context: Context) {
  try {
    requireSameOrigin(request);
    const { token } = await context.params;
    await limitPerHour(`submit-ip:${clientAddressKey(request)}`, SUBMISSION_LINK.submitsPerIpPerHour);
    await limitPerHour(`submit-link:${await submissionLinkId(token)}`, SUBMISSION_LINK.submitsPerLinkPerHour);
    const input = validateVendorSave(await readJsonObject(request, 256 * 1024));
    return privateJson(await submitByToken(token, input));
  } catch (error) { return errorResponse(error, "Unable to submit your listing"); }
}
