import { getAllLocations } from "@/db/queries/locations";
import { getAllServices } from "@/db/queries/services";
import WeddingDetailsPage from "@/components/serviceComponents/WeddingDetailsPage";

export default async function VendorsPage() {
  const [locations, services] = await Promise.all([
    getAllLocations(),
    getAllServices(),
  ]);
  return (
    <div>
      <WeddingDetailsPage latestLocations={locations} latestServices={services} />
    </div>
  );
}
