import { VendorType } from "@/types/dataTypes";
const retrieveVendorsByService = async (
  serviceId: string,
): Promise<VendorType[]> => {
  return await fetch(`api/vendors?serviceIds=${serviceId}`).then((response) =>
    response.json(),
  );
};

export { retrieveVendorsByService };
