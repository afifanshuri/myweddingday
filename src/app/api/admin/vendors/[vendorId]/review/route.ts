import { requireAdmin, requireSameOrigin } from "@/services/others/adminAuthService";
import { privateJson } from "@/services/others/accountAccessService";
import { errorResponse, readBody, RequestError } from "@/services/others/requestValidation";
import { reviewAdminVendor } from "@/services/others/vendorAdminService";
import { REVIEW_NOTE_MAX } from "@/config/vendorStatus";

type Context = { params: Promise<{ vendorId: string }> };

// Approve or reject a listing. Body: { status: "approved" | "rejected", note?: string }.
export async function POST(request: Request, context: Context) {
  try {
    requireSameOrigin(request);
    await requireAdmin();
    const { vendorId } = await context.params;
    if (!/^[1-9]\d{0,9}$/.test(vendorId) || Number(vendorId) > 2147483647) throw new RequestError("Vendor not found", 404);
    let body: { status?: unknown; note?: unknown } | null;
    try { body = await (await readBody(request, 4096)).json(); } catch (error) {
      if (error instanceof RequestError) throw error;
      throw new RequestError("Invalid review");
    }
    if (body?.status !== "approved" && body?.status !== "rejected") throw new RequestError("Choose approve or reject");
    if (body.note !== undefined && body.note !== null && typeof body.note !== "string") throw new RequestError("Invalid review note");
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (note.length > REVIEW_NOTE_MAX) throw new RequestError(`The reason must be at most ${REVIEW_NOTE_MAX} characters`);
    return privateJson(await reviewAdminVendor(Number(vendorId), body.status, note || null));
  } catch (error) { return errorResponse(error, "Unable to review vendor"); }
}
