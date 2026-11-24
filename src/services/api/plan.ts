import type { SavedPlan, SavedPlanResponse } from "@/config/weddingPlan";

export class PlanConflict extends Error {
  constructor(public current: SavedPlanResponse) { super("Your plan was changed somewhere else"); }
}

export async function APIGetPlan(signal?: AbortSignal): Promise<SavedPlanResponse> {
  const response = await fetch("/api/account/plan", { cache: "no-store", signal });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error ?? "Unable to load your plan"), { status: response.status });
  return data;
}

/** Saves the plan on top of `baseRevision`. Throws PlanConflict when the saved plan is newer. */
export async function APISavePlan(plan: SavedPlan, baseRevision: number, keepalive = false): Promise<{ revision: number; updatedAt: string }> {
  const response = await fetch("/api/account/plan", { method: "PUT", cache: "no-store", keepalive,
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan, baseRevision }) });
  const data = await response.json().catch(() => ({}));
  if (response.status === 409 && data.current) throw new PlanConflict(data.current);
  if (!response.ok) throw Object.assign(new Error(data.error ?? "Unable to save your plan"), { status: response.status });
  return data;
}

export async function APIChangePassword(currentPassword: string, newPassword: string) {
  const response = await fetch("/api/account/password", { method: "POST", cache: "no-store",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Unable to update your password");
}
