import { ServiceSelector } from "@/components/serviceComponents/ServiceSelector";
import { SERVICE_ID } from "@/constants/commonConstants";
import { getAllLocations } from "@/db/queries/locations";
import { getAllServices } from "@/db/queries/services";
import WeddingDetailsPage from "@/subpages/services/WeddingDetailsPage";
import { ServiceType } from "@/types/dataTypes";

export default async function VendorsPage() {
  const services = await getAllServices();
  const locations = await getAllLocations();
  return (
    <div>
      <WeddingDetailsPage locations={locations}/>
      <ServiceSelector servicesList={services} />
    </div>
  );
}
