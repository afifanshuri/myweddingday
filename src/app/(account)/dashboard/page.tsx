import { Suspense } from "react";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { ROUTES } from "@/config/routes";
import DashboardPlan from "@/components/commonComponents/DashboardPlan";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";
import { getAllServices } from "@/db/queries/services";

// Signed-in only, so there is no signed-out shell to validate as an instant navigation (see the account layout).
export const instant = false;

async function DashboardContent() {
  await requireRouteAccess(ROUTES.dashboard);
  const services = await getAllServices();

  return <main className="mx-auto min-h-screen max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
    <DashboardPlan services={services.map((service) => ({ id: service.id, name: service.serviceName }))} />
  </main>;
}

export default function DashboardPage() {
  return <Suspense fallback={<LoadingScreen label="Loading your dashboard…" />}>
    <DashboardContent />
  </Suspense>;
}
