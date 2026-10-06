import { ServiceType } from "@/types/dataTypes";

const APIGetServicesByIds = async (
  idList: number[],
): Promise<ServiceType[]> => {
  return await fetch(`/api/services?serviceIds=${idList.join(",")}`).then(
    (response) => response.json(),
  );
};

const APIGetServicesAll = async (): Promise<ServiceType[]> => {
  const response = await fetch("/api/services");
  if (!response.ok) throw new Error("Failed to load services");
  return response.json();
};

export { APIGetServicesAll, APIGetServicesByIds };
