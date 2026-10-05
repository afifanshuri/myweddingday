import "server-only";
import { createClient } from "@supabase/supabase-js";

// Only use after authorization. Keep elevated access separate from cookie sessions.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PRIVATE_SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
