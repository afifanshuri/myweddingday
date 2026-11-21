import { Suspense } from "react";
import ResetPasswordForm from "@/components/authComponents/ResetPasswordForm";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { ROUTES } from "@/config/routes";

// Reached from a password-reset link: /auth/confirm signs the user in first, then redirects here.
async function ResetPasswordContent() {
  await requireRouteAccess(ROUTES.resetPassword);
  return <ResetPasswordForm />;
}
export default function ResetPasswordPage() {
  return <Suspense fallback={<p role="status" className="p-6">Checking account access…</p>}><ResetPasswordContent /></Suspense>;
}
