import { ServiceType } from "@/types/dataTypes";

const APIGetServicesAll = async (): Promise<ServiceType[]> => {
  const response = await fetch("/api/services");
  if (!response.ok) throw new Error("Failed to load services");
  return response.json();
};

export { APIGetServicesAll };
