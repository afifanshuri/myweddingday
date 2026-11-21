import { getAllServices } from "@/db/queries/services";
import { errorResponse } from "@/services/others/requestValidation";

export async function GET() {
  try {
    return Response.json(await getAllServices());
  } catch (error) {
    return errorResponse(error, "Unable to load services");
  }
}
