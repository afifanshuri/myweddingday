import "server-only";
import { getAccountAccess } from "./accountAccessService";
import { RequestError } from "./requestValidation";
import type { User } from "@supabase/supabase-js";

export function assertAdminUser(user: Pick<User, "app_metadata"> | null) {
  if (!user) throw new RequestError("Sign in to continue", 401);
  if (user.app_metadata.role !== "admin") throw new RequestError("Admin access required", 403);
}

export async function requireAdmin() {
  const access = await getAccountAccess();
  if (!access.userId) throw new RequestError("Sign in to continue", 401);
  if (access.role !== "admin") throw new RequestError("Admin access required", 403);
  return { id: access.userId };
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    throw new RequestError("Cross-origin writes are not allowed", 403);
  }
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    throw new RequestError("Cross-origin writes are not allowed", 403);
  }
}
