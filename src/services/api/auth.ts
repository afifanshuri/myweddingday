import { createClient } from "@/utils/supabase/client";

export async function APICreateAuthAccount(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signUp({ email, password, options: { data: { firstTimeLogin: true } } });
}

export async function APICreateAuthSession(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function APIDeleteAuthSession() {
  return createClient().auth.signOut({ scope: "local" });
}
