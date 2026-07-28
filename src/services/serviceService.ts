import { useServiceStore } from "@/app/store/serviceStore";
import { ServiceType } from "@/types/dataTypes";

const retrieveServicesListFromSearchParams = async (
  idList: string,
): Promise<ServiceType[]> => {
  return await fetch(`/api/services?serviceIds=${idList}`).then((response) =>
    response.json(),
  );
};

const retrieveServicesList = async (): Promise<ServiceType[]> => {
  return await fetch("/api/services").then((response) => response.json());
};

export { retrieveServicesList, retrieveServicesListFromSearchParams };
