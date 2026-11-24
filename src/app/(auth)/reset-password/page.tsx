import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ResetPasswordForm from "@/components/authComponents/ResetPasswordForm";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { createClient } from "@/utils/supabase/server";
import { ROUTES } from "@/config/routes";
import { RECOVERY_SESSION_COOKIE } from "@/config/auth";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";

// Reached from a password-reset link (/auth/confirm signs the user in first) or by a signed-in user changing their password.
async function ResetPasswordContent() {
  await requireRouteAccess(ROUTES.resetPassword);
  const cookieStore = await cookies();
  const { data } = await createClient(cookieStore).auth.getClaims();
  const recoverySession = cookieStore.get(RECOVERY_SESSION_COOKIE)?.value;
  const fromResetLink = Boolean(recoverySession && recoverySession === data?.claims.session_id);
  // A normal signed-in session changes its password in Settings, which asks for the current password first.
  if (!fromResetLink) redirect(ROUTES.settings);
  return <ResetPasswordForm fromResetLink />;
}
export default function ResetPasswordPage() {
  return <Suspense fallback={<LoadingScreen label="Checking account access…" />}><ResetPasswordContent /></Suspense>;
}
