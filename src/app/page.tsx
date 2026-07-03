import WeddingDetailsForm from "@/components/WeddingDetailsForm";
import { getAllServices } from "@/db/queries/services";
import { retrieveServicesList } from "@/services/serviceService";

export default async function Home() {
  const servicesList = await getAllServices();
  return (
    <div
      id="mainContainer"
      className="flex flex-col w-full justify-center items-center h-screen"
    >
      <h1>My Wedding Day</h1>
      <WeddingDetailsForm servicesList={servicesList} />
    </div>
  );
}
