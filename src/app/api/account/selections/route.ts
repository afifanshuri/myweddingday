import { db } from "@/db";
import { packagesTable, vendorsTable, servicesTable } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getAccountAccess, privateJson } from "@/services/others/accountAccessService";
import { errorResponse, positiveId, readBody, RequestError } from "@/services/others/requestValidation";
import { requireSameOrigin } from "@/services/others/adminAuthService";
import { throttleSearch } from "@/services/others/manualSearchService";
import { unlockedVendorIds } from "@/services/others/unlockService";
import { shownVendorIds } from "@/services/others/shownVendorService";

// Names and prices for the packages in the user's budget (at most 6 IDs, throttled per account), from approved vendors.
// Plus sees any of them. A free account sees those from vendors its free search unlocked; the others are listed in
// `locked` (not missing), so the browser keeps them in the plan without showing them. Packages whose vendor still
// exists but isn't approved right now (rejected or back in review) are listed in `unavailable`: the browser keeps them
// and shows them as currently unavailable, as are packages from vendors the account was never shown in its results
// (so made-up IDs reveal nothing). Only packages that no longer exist are missing from all three.
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const access = await getAccountAccess();
    if (!access.userId) throw new RequestError("Sign in to see your budget", 401);
    await throttleSearch(access.userId, "selection");
    let ids: unknown;
    try { ids = await (await readBody(request, 4096)).json(); } catch (error) {
      if (error instanceof RequestError) throw error;
      throw new RequestError("Invalid selection list");
    }
    if (!Array.isArray(ids) || ids.length > 6) throw new RequestError("Invalid selection list");
    const packageIds = [...new Set(ids.map(positiveId))];
    if (!packageIds.length) return privateJson({ packages: [], locked: [], unavailable: [] });
    const all = await db.select({ serviceId: vendorsTable.serviceId, serviceName: servicesTable.serviceName,
      vendorId: vendorsTable.id, vendorName: vendorsTable.vendorName, packageId: packagesTable.id,
      packageName: packagesTable.packageName, unitPrice: packagesTable.price, status: vendorsTable.status })
      .from(packagesTable).innerJoin(vendorsTable, eq(packagesTable.vendorId, vendorsTable.id))
      .innerJoin(servicesTable, eq(vendorsTable.serviceId, servicesTable.id)).where(inArray(packagesTable.id, packageIds));
    // Nothing about an unavailable vendor is sent beyond the package ID the browser already has.
    const shown = await shownVendorIds(access, all.map((record) => record.vendorId));
    const unavailable = all.filter((record) => record.status !== "approved" || !shown.has(record.vendorId)).map((record) => record.packageId);
    const records = all.filter((record) => record.status === "approved" && shown.has(record.vendorId));
    if (access.canViewVendorIdentity) return privateJson({ packages: records, locked: [], unavailable });
    const unlocked = await unlockedVendorIds(access.userId, records.map((record) => record.vendorId));
    return privateJson({
      packages: records.filter((record) => unlocked.has(record.vendorId)),
      locked: records.filter((record) => !unlocked.has(record.vendorId)).map((record) => record.packageId),
      unavailable,
    });
  } catch (error) { return errorResponse(error, "Unable to load selected packages"); }
}
