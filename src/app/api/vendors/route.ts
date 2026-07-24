import { insertPackage } from "@/db/queries/packages";
import {
  getAllVendorsByServiceIdArray,
  insertVendor,
} from "@/db/queries/vendors";
import { VendorType } from "@/types/basicTypes";
import { NextRequest, NextResponse } from "next/server";

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

export async function POST(request: NextRequest) {
  console.info("In The Vendor API POST Method");
  try {
    const data = await request.json();
    const response = await insertVendor(data);
    return NextResponse.json(response);
  } catch (e) {
    console.error(e);
  }
}
