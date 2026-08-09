import { getAllLocations } from "@/db/queries/locations";
import { getAllServices } from "@/db/queries/services";
import WeddingDetailsPage from "@/subpages/services/WeddingDetailsPage";

export default async function VendorsPage() {
  const services = await getAllServices();
  const locations = await getAllLocations();
  return (
    <div>
      <WeddingDetailsPage locations={locations} services={services} />
    </div>
  );
}
