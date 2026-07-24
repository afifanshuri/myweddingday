import { getVendorById } from "@/db/queries/vendors";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  return await getVendorById(Number(id));
}
