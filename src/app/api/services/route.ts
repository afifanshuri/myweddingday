import { getAllServices, getServicesById } from "@/db/queries/services";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("test");
  let result = [];
  const selectedServiceIds = request.nextUrl.searchParams.get("serviceIds");
  if (
    !selectedServiceIds ||
    selectedServiceIds === "" ||
    selectedServiceIds === null
  ) {
    result = await getAllServices();
  } else {
    result = await getServicesById(selectedServiceIds.split(",").map(Number));
  }
  return NextResponse.json(result);
}
