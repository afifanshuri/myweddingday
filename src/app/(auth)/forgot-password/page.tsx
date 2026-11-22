import { Suspense } from "react";
import ForgotPasswordForm from "@/components/authComponents/ForgotPasswordForm";
import { redirectSignedInUser } from "@/services/others/pageAccessService";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";

async function ForgotPasswordContent() {
  await redirectSignedInUser();
  return <ForgotPasswordForm />;
}
export default function ForgotPasswordPage() {
  return <Suspense fallback={<LoadingScreen label="Checking account access…" />}><ForgotPasswordContent /></Suspense>;
}
