import { requireAdmin, requireSameOrigin } from "@/services/others/adminAuthService";
import { privateJson } from "@/services/others/accountAccessService";
import { errorResponse, readJsonObject } from "@/services/others/requestValidation";
import { issueUpload, validateUploadRequest } from "@/services/others/uploadService";
import { limitPerHour } from "@/services/others/publicRateLimit";

// A one-time Storage upload link for a file in the admin vendor form. Body: { kind, fileName, contentType, size }.
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const admin = await requireAdmin();
    const upload = validateUploadRequest(await readJsonObject(request));
    await limitPerHour(`upload-admin:${admin.id}`, 600);
    return privateJson(await issueUpload(`admin:${admin.id}`, upload), 201);
  } catch (error) { return errorResponse(error, "Unable to prepare the upload"); }
}
