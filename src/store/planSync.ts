import { create } from "zustand";
import { usePreferenceStore, planSnapshot, type PreferenceStore } from "./preferenceStore";
import { APIGetPlan, APISavePlan, PlanConflict } from "@/services/api/plan";
import { WEDDING_PLAN, planHasContent, type SavedPlan, type SavedPlanResponse } from "@/config/weddingPlan";

/**
 * Keeps the planner (preferenceStore, which also caches the plan in localStorage) in step with the plan saved in the account.
 * - On sign-in the account's plan wins. A plan already in this browser is uploaded only if the account has none, or if it
 *   holds this account's own unsaved changes made on top of the latest saved version.
 * - Changes are saved shortly after they're made. The server refuses a save based on an older version (another device or an
 *   old tab saved in between); the newer saved plan is then loaded instead and the user is told.
 * - A plan belonging to another account is cleared from the browser before anything is shown, and sign-out clears it too.
 */
type PlanStatus = { userId: string | null; status: "idle" | "loading" | "ready" | "error"; saving: boolean; failed: boolean; notice: string | null };
export const usePlanStatus = create<PlanStatus>(() => ({ userId: null, status: "idle", saving: false, failed: false, notice: null }));

const NOTICES = {
  restored: "We restored the plan saved in your account.",
  conflict: "Your plan was changed on another device, so we loaded the latest version.",
  updated: "Your plan was updated with changes from another device.",
} as const;

/** JSON with object keys sorted, so plans can be compared after a database round trip (jsonb reorders keys). */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}
const planKey = (state: PreferenceStore) => stable(planSnapshot(state));
const planChanged = (state: PreferenceStore, previous: PreferenceStore) => state.weddingDetails !== previous.weddingDetails
  || state.preferencesList !== previous.preferencesList || state.selectedPackages !== previous.selectedPackages
  || state.shortlist !== previous.shortlist || state.manualSearch !== previous.manualSearch || state.manualSearchRequested !== previous.manualSearchRequested;

type Engine = { stop: () => void; flush: () => Promise<void>; retry: () => void };
let engine: Engine | null = null;

export function startPlanSync(userId: string) {
  stopPlanSync();
  engine = createEngine(userId);
}
export function stopPlanSync() {
  engine?.stop();
  engine = null;
}
/** Saves any unsaved changes now (used before signing out). */
export async function flushPlan() {
  await engine?.flush();
}
export function retryPlanLoad() {
  engine?.retry();
}
/** Removes the plan from this browser (after sign-out). The account keeps its saved copy. */
export function clearLocalPlan() {
  stopPlanSync();
  const store = usePreferenceStore.getState();
  store.deleteAllPreferenceData();
  store.setPlanSync({ owner: null, revision: 0, dirty: false });
  usePlanStatus.setState({ userId: null, status: "idle", saving: false, failed: false, notice: null });
}

function createEngine(userId: string): Engine {
  const store = usePreferenceStore;
  const controller = new AbortController();
  let stopped = false, loaded = false, applying = false, again = false;
  let saveTimer: ReturnType<typeof setTimeout> | undefined, retryTimer: ReturnType<typeof setTimeout> | undefined;
  let inflight: Promise<void> | null = null;
  const status = (update: Partial<PlanStatus>) => { if (!stopped) usePlanStatus.setState(update); };

  /** Changes the store without counting it as the user's edit. */
  function quietly(change: () => void) {
    applying = true;
    try { change(); } finally { applying = false; lastKey = planKey(store.getState()); }
  }
  function apply(remote: SavedPlanResponse) {
    quietly(() => {
      if (remote.plan) store.getState().applySavedPlan(remote.plan, userId, remote.revision);
      else { store.getState().deleteAllPreferenceData(); store.getState().setPlanSync({ owner: userId, revision: remote.revision, dirty: false }); }
    });
  }
  const schedule = (delay: number) => { clearTimeout(saveTimer); saveTimer = setTimeout(() => { void push(); }, delay); };

  // A plan left by another account is cleared before anything is shown.
  if (store.getState().planSync.owner && store.getState().planSync.owner !== userId) {
    applying = true;
    store.getState().deleteAllPreferenceData();
    store.getState().setPlanSync({ owner: null, revision: 0, dirty: false });
    applying = false;
  }
  let lastKey = planKey(store.getState());
  const unsubscribe = store.subscribe((state, previous) => {
    if (applying || stopped || !planChanged(state, previous)) return;
    const next = planKey(state);
    if (next === lastKey) return;
    lastKey = next;
    if (!state.planSync.dirty) state.setPlanSync({ dirty: true });
    if (loaded) schedule(WEDDING_PLAN.saveDelayMs);
  });

  async function load(initial: boolean) {
    clearTimeout(retryTimer);
    try {
      const remote = await APIGetPlan(controller.signal);
      if (stopped) return;
      const local = store.getState();
      const sync = local.planSync;
      const mine = sync.owner === userId;
      const localPlan: SavedPlan = planSnapshot(local);
      if (remote.plan && stable(remote.plan) === stable(localPlan)) {
        // Already the same (for example, a save sent while the page was closing went through).
        quietly(() => local.setPlanSync({ owner: userId, revision: remote.revision, dirty: false }));
      } else if (mine && sync.revision === remote.revision) {
        // This browser's copy is based on the latest saved version; upload it if it has unsaved changes.
        if (sync.dirty) schedule(0);
      } else if (remote.plan) {
        const hadContent = planHasContent(localPlan);
        apply(remote);
        const notice = !hadContent ? null : !mine ? NOTICES.restored : sync.dirty ? NOTICES.conflict : initial ? null : NOTICES.updated;
        if (notice) status({ notice });
      } else {
        // Nothing saved in the account yet: this browser's plan (if any) becomes the saved one.
        quietly(() => local.setPlanSync({ owner: userId, revision: 0, dirty: planHasContent(localPlan) }));
        if (planHasContent(localPlan)) schedule(0);
      }
      loaded = true;
      status({ status: "ready" });
    } catch {
      if (stopped) return;
      if (!loaded) status({ status: "error" });
      retryTimer = setTimeout(() => { void load(initial && !loaded); }, WEDDING_PLAN.retryDelayMs);
    }
  }

  async function push(): Promise<void> {
    if (stopped || !loaded) return;
    if (inflight) { again = true; return inflight; }
    const state = store.getState();
    if (!state.planSync.dirty || state.planSync.owner !== userId) return;
    const plan = planSnapshot(state);
    const sentKey = stable(plan);
    clearTimeout(saveTimer);
    status({ saving: true });
    inflight = (async () => {
      try {
        const result = await APISavePlan(plan, state.planSync.revision);
        if (stopped) return;
        const unchanged = planKey(store.getState()) === sentKey;
        store.getState().setPlanSync({ revision: result.revision, dirty: !unchanged });
        status({ failed: false });
        if (!unchanged) again = true;
      } catch (error) {
        if (stopped) return;
        if (error instanceof PlanConflict) {
          apply(error.current);
          status({ notice: NOTICES.conflict, failed: false });
        } else {
          status({ failed: true });
          clearTimeout(retryTimer);
          retryTimer = setTimeout(() => { void push(); }, WEDDING_PLAN.retryDelayMs);
        }
      } finally {
        inflight = null;
        status({ saving: false });
        if (again && !stopped) { again = false; schedule(WEDDING_PLAN.saveDelayMs); }
      }
    })();
    return inflight;
  }

  // Coming back to the tab: save pending changes, or pick up changes made on another device.
  const onVisible = () => {
    if (document.visibilityState !== "visible" || !loaded || inflight) return;
    if (store.getState().planSync.dirty) schedule(0);
    else void load(false);
  };
  // Closing the page: send unsaved changes without waiting for the answer (checked on the next load).
  const onPageHide = () => {
    const state = store.getState();
    if (!loaded || inflight || !state.planSync.dirty || state.planSync.owner !== userId) return;
    void APISavePlan(planSnapshot(state), state.planSync.revision, true).catch(() => undefined);
  };
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("pagehide", onPageHide);

  status({ userId, status: "loading", saving: false, failed: false, notice: null });
  void load(true);

  return {
    stop() {
      stopped = true;
      controller.abort();
      clearTimeout(saveTimer); clearTimeout(retryTimer);
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pagehide", onPageHide);
    },
    async flush() {
      clearTimeout(saveTimer);
      if (inflight) await inflight;
      await push();
    },
    retry() {
      if (stopped || loaded) return;
      status({ status: "loading" });
      void load(true);
    },
  };
}
