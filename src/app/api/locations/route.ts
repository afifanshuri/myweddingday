import { getAllLocations } from "@/db/queries/locations";
import { errorResponse } from "@/services/others/requestValidation";

export async function GET() {
  try {
    return Response.json(await getAllLocations());
  } catch (error) {
    return errorResponse(error, "Unable to load locations");
  }
}
