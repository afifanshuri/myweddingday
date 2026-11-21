import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { resolveLoginDestination } from "@/services/others/loginRoutingService";
import { ROUTES } from "@/config/routes";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/**
 * Finishes sign-in from Supabase email links. Supports both link styles:
 * - `?code=` (PKCE, the default link for this app's browser client; must be opened in the same browser)
 * - `?token_hash=&type=` (custom email templates; works on any device)
 * Recovery links continue to the new-password page. Destinations are fixed; no URL from the link is trusted.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const code = params.get("code");
  const rawType = params.get("type");
  const type = OTP_TYPES.find((candidate) => candidate === rawType) ?? null;
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url));

  const supabase = createClient(await cookies());
  let error: unknown = null;
  if (tokenHash && type) ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  else if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code));
  else error = true;
  if (error) return go(`${ROUTES.login}?notice=link-invalid`);

  if (type === "recovery") return go(ROUTES.resetPassword);
  try {
    return go((await resolveLoginDestination(true)) ?? ROUTES.login);
  } catch {
    return go(ROUTES.login);
  }
}
