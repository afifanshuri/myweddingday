import { VendorType } from "@/types/dataTypes";
import { VendorMatchDTOType } from "@/types/dtoTypes";

const retrieveVendorsByService = async (
  serviceId: number[],
): Promise<VendorType[]> => {
  return await fetch(`api/vendors?serviceIds=${serviceId.join(",")}`).then(
    (response) => response.json(),
  );
};

const retrieveVendorsByPreference = async (
  preferencesList: VendorMatchDTOType[],
) => {
  const response = await fetch("/api/match/vendors", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preferencesList),
  });
  const data = await response.json();
  return data;
};

export { retrieveVendorsByService, retrieveVendorsByPreference };
