import "server-only";
import { createClient as createStatelessClient } from "@supabase/supabase-js";
import { RequestError } from "./requestValidation";

/**
 * Confirms a signed-in user's current password before a sensitive change (new password, deleting the account).
 * Uses a separate client that keeps no session, then ends the session the check created.
 */
export async function verifyCurrentPassword(user: { id: string; email?: string | null }, password: unknown) {
  if (typeof password !== "string" || !password || password.length > 200) throw new RequestError("Enter your current password");
  if (!user.email) throw new RequestError("Sign in again and try once more", 401);
  const checker = createStatelessClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await checker.auth.signInWithPassword({ email: user.email, password });
  if (error || data.user?.id !== user.id) {
    if (error?.status === 429) throw new RequestError("Too many attempts. Please wait and try again.", 429, 60);
    throw new RequestError("Your current password is incorrect", 400);
  }
  await checker.auth.signOut({ scope: "local" }).catch(() => undefined);
}
