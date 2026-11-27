import { cookies } from "next/headers";
import { verifyCurrentPassword } from "@/services/others/passwordCheck";
import { getVerifiedAccountUser, privateJson } from "@/services/others/accountAccessService";
import { requireSameOrigin } from "@/services/others/adminAuthService";
import { throttleSearch } from "@/services/others/manualSearchService";
import { limitPerHour } from "@/services/others/publicRateLimit";
import { RequestError, errorResponse, readJsonObject } from "@/services/others/requestValidation";
import { createClient } from "@/utils/supabase/server";
import { PASSWORD_RULES } from "@/config/auth";

// A signed-in user changes their password: the current password is checked first. (Users who forgot it use a reset link.)
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const user = await getVerifiedAccountUser();
    if (!user?.email) throw new RequestError("Sign in to change your password", 401);
    await throttleSearch(user.id, "password");
    await limitPerHour(`password:${user.id}`, 10);
    const body = await readJsonObject(request, 8192);
    const { currentPassword, newPassword, captchaToken } = body;
    if (typeof currentPassword !== "string" || !currentPassword || currentPassword.length > 200) throw new RequestError("Enter your current password");
    if (typeof newPassword !== "string" || newPassword.length < PASSWORD_RULES.minLength || newPassword.length > 200) {
      throw new RequestError(`Choose a new password. ${PASSWORD_RULES.hint}`);
    }
    await verifyCurrentPassword(user, currentPassword, captchaToken);

    const { error } = await createClient(await cookies()).auth.updateUser({ password: newPassword });
    if (error) {
      throw new RequestError(error.code === "same_password" ? "Choose a password different from your current one."
        : error.code === "weak_password" ? `That password is too weak. ${PASSWORD_RULES.hint}`
        : "Unable to update your password. Please try again.", 400);
    }
    return privateJson({ updated: true });
  } catch (error) { return errorResponse(error, "Unable to update your password"); }
}
