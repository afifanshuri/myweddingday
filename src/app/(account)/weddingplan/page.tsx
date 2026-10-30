import { getAllLocations } from "@/db/queries/locations";
import { getAllServices } from "@/db/queries/services";
import WeddingDetailsPage from "@/components/weddingDetailComponents/WeddingDetailsPage";
import { Suspense } from "react";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { ROUTES } from "@/config/routes";

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
  return <Suspense fallback={<p role="status" className="p-6">Checking account access…</p>}><WeddingPlanContent /></Suspense>;
}
