import { resolveLoginDestination } from "@/services/others/loginRoutingService";
import { privateJson } from "@/services/others/accountAccessService";
import { requireSameOrigin } from "@/services/others/adminAuthService";
import { errorResponse, RequestError } from "@/services/others/requestValidation";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const destination = await resolveLoginDestination(true);
    if (!destination) throw new RequestError("Sign in to continue", 401);
    return privateJson({ destination });
  } catch (error) { return errorResponse(error, "Unable to finish sign-in"); }
}
