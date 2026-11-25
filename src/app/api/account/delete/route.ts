import { cookies } from "next/headers";
import { getAccountAccess, getVerifiedAccountUser, privateJson } from "@/services/others/accountAccessService";
import { requireSameOrigin } from "@/services/others/adminAuthService";
import { limitPerHour } from "@/services/others/publicRateLimit";
import { verifyCurrentPassword } from "@/services/others/passwordCheck";
import { RequestError, errorResponse, readJsonObject } from "@/services/others/requestValidation";
import { createAdminClient } from "@/utils/supabase/admin";
import { DELETE_ACCOUNT_CONFIRMATION } from "@/config/auth";

/**
 * A signed-in user permanently deletes their own account after confirming their password and typing DELETE.
 * Everything tied to the account goes with it (plan, shortlist, chosen packages, searches, unlocked vendors), through
 * the database's cascades on auth.users. Admin accounts are removed by another admin, so the last admin can't lock
 * everyone out by accident.
 */
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const user = await getVerifiedAccountUser();
    if (!user) throw new RequestError("Sign in to delete your account", 401);
    await limitPerHour(`account-delete:${user.id}`, 5);
    const { password, confirmation } = await readJsonObject(request, 1024);
    if (confirmation !== DELETE_ACCOUNT_CONFIRMATION) throw new RequestError(`Type ${DELETE_ACCOUNT_CONFIRMATION} to confirm`);
    const access = await getAccountAccess();
    if (access.role === "admin") throw new RequestError("Admin accounts can only be removed by another admin.", 403);
    await verifyCurrentPassword(user, password);

    const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
    if (error) throw new RequestError("Unable to delete your account. Please try again.", 500);

    // The account is gone, so its session cookies are just cleared here (there's no session left to sign out of).
    const store = await cookies();
    for (const cookie of store.getAll()) if (cookie.name.startsWith("sb-")) store.delete(cookie.name);
    return privateJson({ deleted: true });
  } catch (error) { return errorResponse(error, "Unable to delete your account"); }
}
