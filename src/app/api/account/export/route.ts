import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { freeSearches, manualSearchSnapshots, unlockedVendors, vendorsTable, weddingPlans } from "@/db/schema";
import { getAccountAccess, getVerifiedAccountUser } from "@/services/others/accountAccessService";
import { limitPerHour } from "@/services/others/publicRateLimit";
import { RequestError, errorResponse } from "@/services/others/requestValidation";

/**
 * A copy of the personal data kept for the signed-in account, as a JSON download: the account, the saved plan
 * (wedding details, preferences, chosen packages, shortlist), the free search and its unlocked vendors, and the saved
 * searches (when and how many matches, not other vendors' details).
 */
export async function GET() {
  try {
    const user = await getVerifiedAccountUser();
    if (!user) throw new RequestError("Sign in to download your data", 401);
    await limitPerHour(`account-export:${user.id}`, 10);
    const access = await getAccountAccess();
    const [plan, free, unlocked, searches] = await Promise.all([
      db.select({ plan: weddingPlans.plan, updatedAt: weddingPlans.updatedAt }).from(weddingPlans).where(eq(weddingPlans.userId, user.id)),
      db.select({ usedAt: freeSearches.usedAt }).from(freeSearches).where(eq(freeSearches.userId, user.id)),
      db.select({ vendorId: unlockedVendors.vendorId, vendorName: vendorsTable.vendorName, unlockedAt: unlockedVendors.unlockedAt })
        .from(unlockedVendors).innerJoin(vendorsTable, eq(vendorsTable.id, unlockedVendors.vendorId))
        .where(eq(unlockedVendors.userId, user.id)).orderBy(asc(unlockedVendors.unlockedAt)),
      db.select({ searchId: manualSearchSnapshots.searchId, createdAt: manualSearchSnapshots.createdAt, expiresAt: manualSearchSnapshots.expiresAt,
        matches: manualSearchSnapshots.matches }).from(manualSearchSnapshots)
        .where(eq(manualSearchSnapshots.userId, user.id)).orderBy(desc(manualSearchSnapshots.createdAt)),
    ]);
    const data = {
      exportedAt: new Date().toISOString(),
      account: { email: user.email ?? null, createdAt: user.created_at, lastSignInAt: user.last_sign_in_at ?? null,
        plan: access.role === "admin" ? "admin" : access.isPaid ? "plus" : "free", plusUntil: access.paidUntil },
      weddingPlan: plan[0] ? { ...plan[0].plan, savedAt: plan[0].updatedAt } : null,
      freeSearchUsedAt: free[0]?.usedAt ?? null,
      unlockedVendors: unlocked,
      savedSearches: searches.map(({ matches, ...search }) => ({ ...search, matchCount: matches.length })),
    };
    const day = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(data, null, 2), { headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="myweddingday-data-${day}.json"`,
      "Cache-Control": "private, no-store",
    } });
  } catch (error) { return errorResponse(error, "Unable to prepare your data"); }
}
