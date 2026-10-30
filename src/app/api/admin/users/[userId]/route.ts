import { requireAdmin, requireSameOrigin } from "@/services/others/adminAuthService";
import { createAdminClient } from "@/utils/supabase/admin";
import { getAccessForUser } from "@/services/others/accessRules";
import { privateJson } from "@/services/others/accountAccessService";
import { updateAccessMetadata } from "@/services/others/adminUserRules";
import { errorResponse, readBody, RequestError } from "@/services/others/requestValidation";

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    requireSameOrigin(request);
    const actor = await requireAdmin();
    const { userId } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) throw new RequestError("Invalid user ID");
    let body: unknown;
    try { body = await (await readBody(request, 4096)).json(); } catch (error) {
      if (error instanceof RequestError) throw error;
      throw new RequestError("Invalid request body");
    }
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data.user) throw new RequestError("User not found", 404);
    const metadata = updateAccessMetadata(data.user.app_metadata, body, actor.id, userId);
    const updated = await admin.auth.admin.updateUserById(userId, { app_metadata: metadata });
    if (updated.error) throw new Error("Unable to update account");
    const fresh = await admin.auth.admin.getUserById(userId);
    if (fresh.error || !fresh.data.user) throw new Error("Unable to reload account");
    return privateJson({ ...getAccessForUser(fresh.data.user), email: fresh.data.user.email ?? "", createdAt: fresh.data.user.created_at });
  } catch (error) { return errorResponse(error, "Unable to update account access"); }
}
