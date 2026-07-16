import { ServiceSelector } from "@/components/serviceComponents/ServiceSelector";
import { SERVICE_ID } from "@/constants/commonConstants";
import { getAllServices } from "@/db/queries/services";
import WeddingDetailsPage from "@/subpages/services/WeddingDetailsPage";
import { ServiceType } from "@/types/basicTypes";

export default async function VendorsPage() {
  const services = await getAllServices();
  /**const services: ServiceType[] = [
    { id: SERVICE_ID.VENUE, createdAt: new Date(), serviceName: "Venue" },
    {
      id: SERVICE_ID.PHOTOGRAPHER,
      createdAt: new Date(),
      serviceName: "Photographer",
    },
    { id: SERVICE_ID.CATERING, createdAt: new Date(), serviceName: "Catering" },
    { id: SERVICE_ID.MUA, createdAt: new Date(), serviceName: "MUA" },
    { id: SERVICE_ID.CLOTHING, createdAt: new Date(), serviceName: "Clothing" },
    { id: SERVICE_ID.PELAMIN, createdAt: new Date(), serviceName: "Pelamin" },
  ];**/
  return (
    <div>
      <WeddingDetailsPage />
      <ServiceSelector servicesList={services} />
    </div>
  );
}
