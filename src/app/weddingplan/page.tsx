import { ServiceSelector } from "@/components/serviceComponents/ServiceSelector";
import { getAllServices } from "@/db/queries/services";
import WeddingDetailsPage from "@/subpages/servicePreference/WeddingDetailsPage";
import { ServiceType } from "@/types/basicTypes";

export default async function VendorsPage() {
  //const servicesList = await getAllServices();
  const services: ServiceType[] = [
    { id: 1, createdAt: new Date(), serviceName: "Venue" },
    { id: 2, createdAt: new Date(), serviceName: "Photographer" },
    { id: 3, createdAt: new Date(), serviceName: "Catering" },
    { id: 4, createdAt: new Date(), serviceName: "MUA" },
    { id: 5, createdAt: new Date(), serviceName: "Clothing" },
    { id: 6, createdAt: new Date(), serviceName: "Pelamin" },
  ];
  return (
    <div>
      <WeddingDetailsPage />
      <ServiceSelector servicesList={services} />
    </div>
  );
}
