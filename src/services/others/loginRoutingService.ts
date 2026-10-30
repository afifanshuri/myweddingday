import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getVerifiedAccountUser } from "./accountAccessService";
import { getAccessForUser } from "./accessRules";
import { getDefaultRoute, ROUTES } from "@/config/routes";
import { RequestError } from "./requestValidation";

// GET page renders only read this flag. The authenticated POST completes it.
export async function resolveLoginDestination(completeFirstLogin = false) {
  const user = await getVerifiedAccountUser();
  if (!user) return null;
  const destination = getDefaultRoute(getAccessForUser(user), user.user_metadata?.firstTimeLogin);
  if (completeFirstLogin && destination === ROUTES.weddingPlan) {
    const supabase = createClient(await cookies());
    // Supabase merges this key into user metadata, preserving other preferences.
    const { error } = await supabase.auth.updateUser({ data: { firstTimeLogin: false } });
    if (error) throw new RequestError("Unable to finish sign-in. Please try again.", 503);
  }
  return destination;
}
