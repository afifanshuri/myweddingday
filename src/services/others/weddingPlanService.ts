import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { weddingPlans } from "@/db/schema";
import type { SavedPlan, SavedPlanResponse } from "@/config/weddingPlan";

export async function getWeddingPlan(userId: string): Promise<SavedPlanResponse> {
  const [row] = await db.select().from(weddingPlans).where(eq(weddingPlans.userId, userId));
  return row ? { plan: row.plan, revision: row.revision, updatedAt: row.updatedAt.toISOString() }
    : { plan: null, revision: 0, updatedAt: null };
}

/**
 * Saves the plan if the browser's copy was based on the latest saved version (`baseRevision`; 0 when nothing is saved yet).
 * Otherwise nothing changes and the current saved plan is returned, so an old tab or another device can't overwrite newer changes.
 */
export async function saveWeddingPlan(userId: string, plan: SavedPlan, baseRevision: number):
  Promise<{ saved: true; revision: number; updatedAt: string } | { saved: false; current: SavedPlanResponse }> {
  const [row] = baseRevision === 0
    ? await db.insert(weddingPlans).values({ userId, plan }).onConflictDoNothing()
      .returning({ revision: weddingPlans.revision, updatedAt: weddingPlans.updatedAt })
    : await db.update(weddingPlans).set({ plan, revision: sql`${weddingPlans.revision} + 1`, updatedAt: new Date() })
      .where(and(eq(weddingPlans.userId, userId), eq(weddingPlans.revision, baseRevision)))
      .returning({ revision: weddingPlans.revision, updatedAt: weddingPlans.updatedAt });
  if (row) return { saved: true, revision: row.revision, updatedAt: row.updatedAt.toISOString() };
  return { saved: false, current: await getWeddingPlan(userId) };
}
