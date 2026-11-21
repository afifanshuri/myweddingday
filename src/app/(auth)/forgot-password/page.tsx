import { Suspense } from "react";
import ForgotPasswordForm from "@/components/authComponents/ForgotPasswordForm";
import { redirectSignedInUser } from "@/services/others/pageAccessService";

async function ForgotPasswordContent() {
  await redirectSignedInUser();
  return <ForgotPasswordForm />;
}
export default function ForgotPasswordPage() {
  return <Suspense fallback={<p role="status" className="p-6">Checking account access…</p>}><ForgotPasswordContent /></Suspense>;
}
