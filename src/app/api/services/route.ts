import { getAllServices, getServicesById } from "@/db/queries/services";
import { NextResponse } from "next/server";

export async function GET() {
  let result = [];
  result = await getAllServices();
  return NextResponse.json(result);
}
