import { Suspense } from "react";
import LoginForm from "@/components/commonComponents/LoginForm";
import { redirectSignedInUser } from "@/services/others/pageAccessService";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";

async function LoginContent() {
  await redirectSignedInUser();
  return <LoginForm />;
}
export default function LoginPage() {
  return <Suspense fallback={<LoadingScreen label="Checking account access…" />}><LoginContent /></Suspense>;
}
