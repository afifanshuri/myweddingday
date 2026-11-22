import { requireSameOrigin } from "@/services/others/adminAuthService";
import { privateJson } from "@/services/others/accountAccessService";
import { errorResponse, RequestError, validatePackageEdits, validatePackages, validateVendor } from "@/services/others/requestValidation";
import { readVendorForm } from "@/services/others/vendorFormParsing";
import { clientAddressKey, limitPerHour } from "@/services/others/publicRateLimit";
import { readSubmission, submissionKind, submitByToken } from "@/services/others/vendorSubmissionService";
import { SUBMISSION_LINK } from "@/config/submissionLinks";

// Public: vendors open and submit their listing from a link; the token in the path is the only credential.
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
    // Checks the link before reading the (up to 25 MB) form.
    const { kind, linkId } = await submissionKind(token);
    await limitPerHour(`submit-link:${linkId}`, SUBMISSION_LINK.submitsPerLinkPerHour);
    const { data, files, vendorFiles } = await readVendorForm(request);
    const vendor = validateVendor(data.vendor);
    if (kind === "new") {
      return privateJson(await submitByToken(token, { kind, vendor, packages: validatePackages(data.packages, vendor.serviceId), files, vendorFiles }));
    }
    const keep = data.keepImagePaths ?? [];
    if (!Array.isArray(keep) || keep.some((path) => typeof path !== "string")) throw new RequestError("Invalid image list");
    return privateJson(await submitByToken(token, { kind, vendor, packages: validatePackageEdits(data.packages, vendor.serviceId),
      files, vendorFiles, keepImagePaths: keep as string[] }));
  } catch (error) { return errorResponse(error, "Unable to submit your listing"); }
}
