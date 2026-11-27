import "server-only";
import { createClient as createStatelessClient } from "@supabase/supabase-js";
import { RequestError } from "./requestValidation";

/**
 * Confirms a signed-in user's current password before a sensitive change (new password, deleting the account).
 * Uses a separate client that keeps no session, then ends the session the check created.
 * captchaToken: the Turnstile token the form sent. Supabase checks this sign-in like any other when CAPTCHA is on.
 */
export async function verifyCurrentPassword(user: { id: string; email?: string | null }, password: unknown, captchaToken?: unknown) {
  if (typeof password !== "string" || !password || password.length > 200) throw new RequestError("Enter your current password");
  if (!user.email) throw new RequestError("Sign in again and try once more", 401);
  const checker = createStatelessClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const token = typeof captchaToken === "string" && captchaToken.length <= 4096 ? captchaToken : undefined;
  const { data, error } = await checker.auth.signInWithPassword({ email: user.email, password, options: { captchaToken: token } });
  if (error?.code?.startsWith("captcha")) throw new RequestError("The security check failed. Please try again.", 400);
  if (error || data.user?.id !== user.id) {
    if (error?.status === 429) throw new RequestError("Too many attempts. Please wait and try again.", 429, 60);
    throw new RequestError("Your current password is incorrect", 400);
  }
  await checker.auth.signOut({ scope: "local" }).catch(() => undefined);
}
