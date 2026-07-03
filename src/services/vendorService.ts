import { VendorType } from "@/types/basicTypes";
const retrieveVendorsByService = async (
  serviceId: string,
): Promise<VendorType[]> => {
  return await fetch(`api/vendors?serviceIds=${serviceId}`).then((response) =>
    response.json(),
  );
};

export { retrieveVendorsByService };
