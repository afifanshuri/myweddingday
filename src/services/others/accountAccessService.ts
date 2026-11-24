import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getAccessForUser } from "./accessRules";
import { RequestError } from "./requestValidation";
import { cache } from "react";

// React cache deduplicates only within a server render; access is never shared between users.
export const getVerifiedAccountUser = cache(async function getVerifiedAccountUser() {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError" && error.status !== 401 && error.status !== 403) {
    throw new RequestError("Unable to verify account access. Please try again.", 503);
  }
  return error ? null : data.user;
});

export const getAccountAccess = cache(async function getAccountAccess() {
  return getAccessForUser(await getVerifiedAccountUser());
});

export function privateJson(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store", Vary: "Cookie, Authorization" } });
}
