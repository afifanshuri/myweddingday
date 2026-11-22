import { Suspense } from "react";
import { redirect } from "next/navigation";
import LandingPage from "@/components/homeComponents/LandingPage";
import { resolveLoginDestination } from "@/services/others/loginRoutingService";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";

async function HomeContent() {
  const destination = await resolveLoginDestination();
  if (destination) redirect(destination);
  return <LandingPage />;
}

export default function Home() {
  return <Suspense fallback={<LoadingScreen label="Loading…" />}>
    <HomeContent />
  </Suspense>;
}
