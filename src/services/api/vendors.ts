import { VendorType } from "@/types/dataTypes";
import { VendorMatchDTOType, VendorAndPackagesMatchDTOType } from "@/types/dtoTypes";

const APIGetVendorsByServiceIds = async (
  serviceId: number[],
): Promise<VendorType[]> => {
  return await fetch(`api/vendors?serviceIds=${serviceId.join(",")}`).then(
    (response) => response.json(),
  );
};

const APIGetVendorsByPreferences = async (
  preferencesList: VendorMatchDTOType[],
): Promise<VendorAndPackagesMatchDTOType[]> => {
  console.log("in APIGetVendorsByPreferences");
  const response = await fetch("/api/match/vendors", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preferencesList),
  });
  if (!response.ok) throw new Error("Unable to load vendor matches");
  const data = await response.json();
  return data;
};

export { APIGetVendorsByServiceIds, APIGetVendorsByPreferences };

export async function APICreateVendorWithPackages(
  formData: FormData,
): Promise<{ id: number; vendorName: string }> {
  const response = await fetch("/api/vendors", {
    method: "POST",
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Unable to save vendor");
  return data;
}
