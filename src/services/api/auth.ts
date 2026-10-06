import { createClient } from "@/utils/supabase/client";

export async function APICreateAuthAccount(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signUp({ email, password });
}

export async function APICreateAuthSession(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}
