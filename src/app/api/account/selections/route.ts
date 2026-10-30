import { db } from "@/db";
import { packagesTable, vendorsTable, servicesTable } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { privateJson, requireVendorAccess } from "@/services/others/accountAccessService";
import { errorResponse, positiveId, readBody, RequestError } from "@/services/others/requestValidation";
import { requireSameOrigin } from "@/services/others/adminAuthService";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await requireVendorAccess();
    let ids: unknown;
    try { ids = await (await readBody(request, 4096)).json(); } catch (error) {
      if (error instanceof RequestError) throw error;
      throw new RequestError("Invalid selection list");
    }
    if (!Array.isArray(ids) || ids.length > 6) throw new RequestError("Invalid selection list");
    const packageIds = [...new Set(ids.map(positiveId))];
    if (!packageIds.length) return privateJson([]);
    const records = await db.select({ serviceId: vendorsTable.serviceId, serviceName: servicesTable.serviceName,
      vendorId: vendorsTable.id, vendorName: vendorsTable.vendorName, packageId: packagesTable.id,
      packageName: packagesTable.packageName, unitPrice: packagesTable.price })
      .from(packagesTable).innerJoin(vendorsTable, eq(packagesTable.vendorId, vendorsTable.id))
      .innerJoin(servicesTable, eq(vendorsTable.serviceId, servicesTable.id)).where(inArray(packagesTable.id, packageIds));
    return privateJson(records);
  } catch (error) { return errorResponse(error, "Unable to load selected packages"); }
}
