import { Suspense } from "react";
import { redirect } from "next/navigation";
import LandingPage from "@/components/homeComponents/LandingPage";
import { resolveLoginDestination } from "@/services/others/loginRoutingService";

async function HomeContent() {
  const destination = await resolveLoginDestination();
  if (destination) redirect(destination);
  return <LandingPage />;
}

export default function Home() {
  return <Suspense fallback={<p role="status" className="flex min-h-screen items-center justify-center">Loading…</p>}>
    <HomeContent />
  </Suspense>;
}
