import { requireAdmin } from "@/services/others/adminAuthService";
import { createAdminClient } from "@/utils/supabase/admin";
import { getAccessForUser } from "@/services/others/accessRules";
import { privateJson } from "@/services/others/accountAccessService";
import { errorResponse, RequestError } from "@/services/others/requestValidation";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const page = Number(new URL(request.url).searchParams.get("page") ?? 1);
    if (!Number.isInteger(page) || page < 1 || page > 100000) throw new RequestError("Invalid page");
    const { data, error } = await createAdminClient().auth.admin.listUsers({ page, perPage: 25 });
    if (error) throw new Error("Unable to list accounts");
    return privateJson({ users: data.users.map((user) => ({ ...getAccessForUser(user), email: user.email ?? "", createdAt: user.created_at })),
      page, hasNext: data.users.length === 25 });
  } catch (error) { return errorResponse(error, "Unable to list accounts"); }
}
