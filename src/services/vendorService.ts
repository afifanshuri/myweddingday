import { VendorType } from "@/types/dataTypes";
import { VendorMatchDTOType } from "@/types/dtoTypes";
import { BasicPreferenceType } from "@/types/preferenceTypes";


const retrieveVendorsByService = async (
  serviceId: number[],
): Promise<VendorType[]> => {
  return await fetch(`api/vendors?serviceIds=${serviceId.join(",")}`).then((response) =>
    response.json(),
  );
};

const retrieveVendorsByPreference = async (
  preferencesList: VendorMatchDTOType[],
) => {
  console.log("Preferences List:", preferencesList);
  const response = await fetch("/api/match/vendors", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(preferencesList),
});
console.log("Response:", response);
const data = await response.json();
return data;
};

export { retrieveVendorsByService, retrieveVendorsByPreference };
