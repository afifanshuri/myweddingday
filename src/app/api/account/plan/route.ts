import { getAccountAccess, privateJson } from "@/services/others/accountAccessService";
import { requireSameOrigin } from "@/services/others/adminAuthService";
import { throttleSearch } from "@/services/others/manualSearchService";
import { RequestError, errorResponse, readJsonObject } from "@/services/others/requestValidation";
import { normalizePlan } from "@/services/others/planValidation";
import { getWeddingPlan, saveWeddingPlan } from "@/services/others/weddingPlanService";
import { WEDDING_PLAN } from "@/config/weddingPlan";

async function signedInUser() {
  const access = await getAccountAccess();
  if (!access.userId) throw new RequestError("Sign in to see your plan", 401);
  return access.userId;
}

// The signed-in user's saved wedding plan ({ plan: null, revision: 0 } when nothing is saved yet).
export async function GET() {
  try {
    const userId = await signedInUser();
    await throttleSearch(userId, "planRead");
    return privateJson(await getWeddingPlan(userId));
  } catch (error) { return errorResponse(error, "Unable to load your plan"); }
}

// Body: { plan, baseRevision }. 409 with the current saved plan when the browser's copy is out of date.
export async function PUT(request: Request) {
  try {
    requireSameOrigin(request);
    const userId = await signedInUser();
    await throttleSearch(userId, "planWrite");
    const body = await readJsonObject(request, WEDDING_PLAN.maxBodyBytes);
    const base = body.baseRevision;
    if (typeof base !== "number" || !Number.isInteger(base) || base < 0 || base > 2147483647) throw new RequestError("Invalid revision");
    const result = await saveWeddingPlan(userId, normalizePlan(body.plan), base);
    return result.saved ? privateJson({ revision: result.revision, updatedAt: result.updatedAt })
      : privateJson({ error: "Your plan was changed somewhere else", current: result.current }, 409);
  } catch (error) { return errorResponse(error, "Unable to save your plan"); }
}
