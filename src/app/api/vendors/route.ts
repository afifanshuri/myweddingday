import { getAllVendorsByServiceIdArray } from "@/db/queries/vendors";
import { VendorType } from "@/types/basicTypes";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  let result: VendorType[] = [];
  const serviceId = request.nextUrl.searchParams.get("serviceIds");
  if (!serviceId || serviceId.length === 0) {
    return Response.json([]);
  } else if (serviceId.length === 1) {
    result = await getAllVendorsByServiceIdArray([Number(serviceId)]);
  } else {
    result = await getAllVendorsByServiceIdArray(
      serviceId.split(",").map(Number),
    );
  }
  return Response.json(result);
}
