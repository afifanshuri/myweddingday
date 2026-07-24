import { getAllLocations } from "@/db/queries/locations";

export async function GET() {
  const result = await getAllLocations();
  return Response.json(result);
}
