import { useServiceStore } from "@/app/store/serviceStore";
import { ServiceType } from "@/types/dataTypes";

const retrieveServicesListByIds = async (
  idList: number[],
): Promise<ServiceType[]> => {
  return await fetch(`/api/services?serviceIds=${idList.join(",")}`).then(
    (response) => response.json(),
  );
};

const retrieveServicesList = async (): Promise<ServiceType[]> => {
  return await fetch("/api/services").then((response) => response.json());
};

export { retrieveServicesList, retrieveServicesListByIds };
