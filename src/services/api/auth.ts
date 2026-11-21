import { createClient } from "@/utils/supabase/client";

export async function APICreateAuthAccount(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signUp({ email, password, options: { data: { firstTimeLogin: true }, emailRedirectTo: confirmUrl() } });
}

export async function APICreateAuthSession(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function APIDeleteAuthSession() {
  return createClient().auth.signOut({ scope: "local" });
}

const confirmUrl = (type?: "recovery") =>
  `${window.location.origin}/auth/confirm${type ? `?type=${type}` : ""}`;

/** Always resolves the same way whether or not the account exists, so the form can't be used to discover accounts. */
export async function APIRequestPasswordReset(email: string) {
  return createClient().auth.resetPasswordForEmail(email, { redirectTo: confirmUrl("recovery") });
}

export async function APIUpdatePassword(password: string) {
  return createClient().auth.updateUser({ password });
}
