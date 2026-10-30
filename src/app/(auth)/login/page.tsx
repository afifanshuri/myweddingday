import { Suspense } from "react";
import LoginForm from "@/components/commonComponents/LoginForm";
import { redirectSignedInUser } from "@/services/others/pageAccessService";

async function LoginContent() {
  await redirectSignedInUser();
  return <LoginForm />;
}
export default function LoginPage() {
  return <Suspense fallback={<p role="status" className="p-6">Checking account access…</p>}><LoginContent /></Suspense>;
}
