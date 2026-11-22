import { Suspense } from "react";
import SubmissionLinksPanel from "@/components/adminComponents/SubmissionLinksPanel";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { ROUTES } from "@/config/routes";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";

async function LinksContent() {
  await requireRouteAccess(ROUTES.adminLinks);
  return <SubmissionLinksPanel />;
}
export default function SubmissionLinksPage() {
  return <Suspense fallback={<LoadingScreen label="Checking admin access…" />}><LinksContent /></Suspense>;
}
