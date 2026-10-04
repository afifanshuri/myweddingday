import { getAllLocations } from "@/db/queries/locations";
import WeddingDetailsPage from "@/components/serviceComponents/WeddingDetailsPage";

export default async function VendorsPage() {
  const locations = await getAllLocations();
  return (
    <div>
      <WeddingDetailsPage locations={locations} />
    </div>
  );
}
