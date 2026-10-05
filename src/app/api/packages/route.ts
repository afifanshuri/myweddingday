import { requireAdmin, requireSameOrigin } from "@/services/adminAuthService";
import { errorResponse } from "@/services/requestValidation";

// Separate package creation could leave partially saved vendors. Use the combined endpoint.
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await requireAdmin();
    return Response.json({ error: "Submit vendor and packages together to /api/vendors" }, { status: 410 });
  } catch (error) {
    return errorResponse(error, "Unable to authorize package submission");
  }
}
