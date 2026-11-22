import { requireAdmin, requireSameOrigin } from "@/services/others/adminAuthService";
import { privateJson } from "@/services/others/accountAccessService";
import { errorResponse, optionalText, readJsonObject, RequestError, requiredText } from "@/services/others/requestValidation";
import { createSubmissionLink, listSubmissionLinks } from "@/services/others/vendorSubmissionService";
import { SUBMISSION_LINK } from "@/config/submissionLinks";

export async function GET() {
  try {
    await requireAdmin();
    return privateJson(await listSubmissionLinks());
  } catch (error) { return errorResponse(error, "Unable to list submission links"); }
}

// Creates a link for a vendor. Body: { label: vendor name, vendorEmail?: string }. The full link is returned only here.
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const admin = await requireAdmin();
    const body = await readJsonObject(request);
    const label = requiredText(body.label, "Vendor name", SUBMISSION_LINK.labelMax);
    const vendorEmail = optionalText(body.vendorEmail, "Email", SUBMISSION_LINK.emailMax);
    if (vendorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendorEmail)) throw new RequestError("Enter a valid email address, or leave it blank");
    return privateJson(await createSubmissionLink({ label, vendorEmail, adminId: admin.id, origin: new URL(request.url).origin }), 201);
  } catch (error) { return errorResponse(error, "Unable to create submission link"); }
}
