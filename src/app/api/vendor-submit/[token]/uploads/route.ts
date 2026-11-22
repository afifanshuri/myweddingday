import { requireSameOrigin } from "@/services/others/adminAuthService";
import { privateJson } from "@/services/others/accountAccessService";
import { errorResponse, readJsonObject } from "@/services/others/requestValidation";
import { validateUploadRequest } from "@/services/others/uploadService";
import { clientAddressKey, limitPerHour } from "@/services/others/publicRateLimit";
import { issueUploadForLink } from "@/services/others/vendorSubmissionService";
import { SUBMISSION_LINK } from "@/config/submissionLinks";

type Context = { params: Promise<{ token: string }> };

// Public: a one-time Storage upload link for a file in the vendor's form. Body: { kind, fileName, contentType, size }.
export async function POST(request: Request, context: Context) {
  try {
    requireSameOrigin(request);
    const upload = validateUploadRequest(await readJsonObject(request));
    await limitPerHour(`upload-ip:${clientAddressKey(request)}`, SUBMISSION_LINK.uploadsPerIpPerHour);
    const { linkId, upload: issued } = await issueUploadForLink((await context.params).token, upload);
    await limitPerHour(`upload-link:${linkId}`, SUBMISSION_LINK.uploadsPerLinkPerHour);
    return privateJson(issued, 201);
  } catch (error) { return errorResponse(error, "Unable to prepare the upload"); }
}
