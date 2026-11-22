import { getAllLocations } from "@/db/queries/locations";
import { getAllServices } from "@/db/queries/services";
import WeddingDetailsPage from "@/components/weddingDetailComponents/WeddingDetailsPage";
import { Suspense } from "react";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { ROUTES } from "@/config/routes";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";

async function WeddingPlanContent() {
  await requireRouteAccess(ROUTES.weddingPlan);
  const [locations, services] = await Promise.all([
    getAllLocations(),
    getAllServices(),
  ]);
  return (
    <div>
      <WeddingDetailsPage
        latestLocations={locations}
        latestServices={services}
      />
    </div>
  );
}

export default function WeddingPlanPage() {
  return <Suspense fallback={<LoadingScreen label="Checking account access…" />}><WeddingPlanContent /></Suspense>;
}
