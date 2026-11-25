import { getAllServices } from "@/db/queries/services";
import { errorResponse } from "@/services/others/requestValidation";

export async function GET() {
  try {
    // Public reference data: cached by browsers and the CDN too, so repeated requests don't reach the app.
    return Response.json(await getAllServices(), { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (error) {
    return errorResponse(error, "Unable to load services");
  }
}
