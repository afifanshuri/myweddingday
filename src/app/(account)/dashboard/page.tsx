import { Suspense } from "react";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { ROUTES } from "@/config/routes";
import DashboardPlan from "@/components/commonComponents/DashboardPlan";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";
import { getAllLocations } from "@/db/queries/locations";
import { getAllServices } from "@/db/queries/services";

async function DashboardContent() {
  await requireRouteAccess(ROUTES.dashboard);
  const [locations, services] = await Promise.all([getAllLocations(), getAllServices()]);

  return <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-8 sm:py-12">
    <DashboardPlan locations={locations.map((location) => ({ id: location.id, name: location.locationName }))}
      services={services.map((service) => ({ id: service.id, name: service.serviceName }))} />
  </main>;
}

export default function DashboardPage() {
  return <Suspense fallback={<LoadingScreen label="Loading your dashboard…" />}>
    <DashboardContent />
  </Suspense>;
}
