import { requireAdmin } from "@/services/others/adminAuthService";
import { privateJson } from "@/services/others/accountAccessService";
import { errorResponse, RequestError } from "@/services/others/requestValidation";
import { listAdminVendors } from "@/services/others/vendorAdminService";
import { isVendorStatus } from "@/config/vendorStatus";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const params = new URL(request.url).searchParams;
    const page = Number(params.get("page") ?? 1);
    if (!Number.isInteger(page) || page < 1 || page > 100000) throw new RequestError("Invalid page");
    const query = (params.get("q") ?? "").trim();
    if (query.length > 100) throw new RequestError("Search text is too long");
    const rawService = params.get("serviceId");
    const serviceId = rawService === null || rawService === "" ? null : Number(rawService);
    if (serviceId !== null && (!Number.isInteger(serviceId) || serviceId < 1)) throw new RequestError("Invalid service filter");
    const rawStatus = params.get("status") ?? "";
    if (rawStatus !== "" && !isVendorStatus(rawStatus)) throw new RequestError("Invalid status filter");
    return privateJson(await listAdminVendors({ query, serviceId, status: rawStatus === "" ? null : rawStatus, page }));
  } catch (error) { return errorResponse(error, "Unable to list vendors"); }
}
