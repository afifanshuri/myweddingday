import { createClient } from "@/utils/supabase/client";

// captchaToken: from useCaptcha (undefined when CAPTCHA isn't set up); Supabase checks it when CAPTCHA is on.
export async function APICreateAuthAccount(email: string, password: string, captchaToken?: string) {
  const supabase = createClient();
  return supabase.auth.signUp({ email, password, options: { data: { firstTimeLogin: true }, emailRedirectTo: confirmUrl(), captchaToken } });
}

export async function APICreateAuthSession(email: string, password: string, captchaToken?: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
}

export async function APIDeleteAuthSession() {
  return createClient().auth.signOut({ scope: "local" });
}

const confirmUrl = (type?: "recovery") =>
  `${window.location.origin}/auth/confirm${type ? `?type=${type}` : ""}`;

/** Always resolves the same way whether or not the account exists, so the form can't be used to discover accounts. */
export async function APIRequestPasswordReset(email: string, captchaToken?: string) {
  return createClient().auth.resetPasswordForEmail(email, { redirectTo: confirmUrl("recovery"), captchaToken });
}

export async function APIUpdatePassword(password: string) {
  return createClient().auth.updateUser({ password });
}

/** Ends every session for the account, including the recovery session and any other devices. */
export async function APIEndAllAuthSessions() {
  return createClient().auth.signOut({ scope: "global" });
}
