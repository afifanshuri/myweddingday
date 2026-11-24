import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { beforeEach, test } from "node:test";
import "./browser-globals";
import { normalizePlan } from "../src/services/others/planValidation";
import { RequestError } from "../src/services/others/requestValidation";
import { emptyPlan, planHasContent, type SavedPlan } from "../src/config/weddingPlan";
import { ROUTES, getRouteRequirement } from "../src/config/routes";

import { usePreferenceStore } from "../src/store/preferenceStore";
import { clearLocalPlan, flushPlan, startPlanSync, stopPlanSync, usePlanStatus } from "../src/store/planSync";

const SEARCH_ID = "3f2b8c1e-5d4a-4b6c-9e7f-1a2b3c4d5e6f";
const plan = (coupleName: string, extra: Partial<SavedPlan> = {}): SavedPlan => ({
  ...emptyPlan(), weddingDetails: { ...emptyPlan().weddingDetails, coupleName, services: [1], pax: 300, locations: [2] }, ...extra,
});

test("plans are cleaned rather than refused, so an odd value never stops a plan from saving", () => {
  const cleaned = normalizePlan({
    weddingDetails: { coupleName: "x".repeat(500), date: "2026-02-30", locations: [2, 2, -1, "3", 4], pax: 1e12,
      services: [1, 1, 99, 3], serviceNames: { 1: "Venue", 3: "Catering", 99: "Fake" } },
    preferencesList: [
      { serviceId: 1, budget: -5, description: 7, criteria: { notACriterion: true }, requiredFields: ["notACriterion"] },
      { serviceId: 1, budget: 100 },
      { serviceId: 99, budget: 100 },
    ],
    selectedPackages: [
      { serviceId: 1, serviceName: "Venue", vendorId: 4, vendorName: "Secret vendor", packageId: 9, packageName: "Gold", unitPrice: 5000 },
      { serviceId: 2, serviceName: "Not in plan", vendorId: 4, packageId: 10, unitPrice: 5000 },
      { serviceId: 3, serviceName: "Catering", vendorId: 5, packageId: 11, unitPrice: -1 },
    ],
    manualSearch: { id: "not-a-uuid", input: "[]" },
    manualSearchRequested: "yes",
    extra: "ignored",
  });
  assert.equal(cleaned.weddingDetails.coupleName.length, 120);
  assert.equal(cleaned.weddingDetails.date, null);
  assert.deepEqual(cleaned.weddingDetails.locations, [2, 4]);
  assert.equal(cleaned.weddingDetails.pax, 100000);
  assert.deepEqual(cleaned.weddingDetails.services, [1, 3]);
  assert.deepEqual(cleaned.weddingDetails.serviceNames, { 1: "Venue", 3: "Catering" });
  assert.deepEqual(cleaned.preferencesList, [{ serviceId: 1, budget: 0, description: "", criteria: {}, requiredFields: [] }]);
  // Only the venue package survives, and vendor/package names are never stored.
  assert.deepEqual(cleaned.selectedPackages, [{ serviceId: 1, serviceName: "Venue", vendorId: 4, vendorName: "", packageId: 9, packageName: "", unitPrice: 5000 }]);
  assert.equal(cleaned.manualSearch, null);
  assert.equal(cleaned.manualSearchRequested, false);
  assert.equal("extra" in cleaned, false);
});

test("a valid plan comes back unchanged, and a body that isn't a plan is refused", () => {
  const valid = plan("Amira & Syafiq", { manualSearch: { id: SEARCH_ID, input: "[]", pending: false, createdAt: 1700000000000 } });
  valid.weddingDetails.date = "2027-01-09";
  valid.weddingDetails.serviceNames = { 1: "Venue" };
  assert.deepEqual(normalizePlan(valid), valid);
  assert.throws(() => normalizePlan(null), RequestError);
  assert.throws(() => normalizePlan([]), RequestError);
  assert.throws(() => normalizePlan({ weddingDetails: "x" }), RequestError);
  assert.equal(planHasContent(emptyPlan()), false);
  assert.equal(planHasContent(valid), true);
});

test("settings needs a signed-in user, and the plans table is closed to browser clients", () => {
  assert.equal(getRouteRequirement(ROUTES.settings), "signedIn");
  assert.equal(getRouteRequirement(ROUTES.dashboard), "signedIn");
  const sql = readFileSync(new URL("../migrations/20261122133618_wedding_plans/migration.sql", import.meta.url), "utf8");
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /REVOKE ALL ON public\.wedding_plans FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /ON DELETE CASCADE/);
});

// ---- Sync rules, against an in-memory server that behaves like PUT/GET /api/account/plan ----
let server: { plan: SavedPlan | null; revision: number };
let calls: { method: string; baseRevision?: number; plan?: SavedPlan }[];
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
globalThis.fetch = (async (_url: string, init: RequestInit = {}) => {
  if (!init.method) { calls.push({ method: "GET" }); return respond({ ...server, updatedAt: null }); }
  const body = JSON.parse(String(init.body));
  calls.push({ method: init.method, baseRevision: body.baseRevision, plan: body.plan });
  if (body.baseRevision !== server.revision) return respond({ error: "conflict", current: { ...server, updatedAt: null } }, 409);
  server = { plan: normalizePlan(body.plan), revision: server.revision + 1 };
  return respond({ revision: server.revision, updatedAt: "" });
}) as typeof fetch;

const store = () => usePreferenceStore.getState();
const coupleName = () => store().weddingDetails.coupleName;
async function ready() {
  for (let i = 0; i < 200 && usePlanStatus.getState().status !== "ready"; i++) await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(usePlanStatus.getState().status, "ready");
}
/** Puts a plan in "this browser", as left by `owner` (null: saved before plans were kept in accounts). */
function browserHas(value: SavedPlan, owner: string | null, revision = 0, dirty = false) {
  store().applySavedPlan(value, owner ?? "nobody", revision);
  store().setPlanSync({ owner, revision, dirty });
}

beforeEach(() => {
  clearLocalPlan();
  server = { plan: null, revision: 0 };
  calls = [];
});

test("signing in on a browser that holds another account's plan clears it and loads your own", async () => {
  server = { plan: plan("Mine"), revision: 3 };
  browserHas(plan("Someone else"), "user-b", 7);
  startPlanSync("user-a");
  assert.equal(coupleName(), "", "the other account's plan is gone before anything is shown");
  await ready();
  assert.equal(coupleName(), "Mine");
  assert.deepEqual(store().planSync, { owner: "user-a", revision: 3, dirty: false });
  assert.equal(usePlanStatus.getState().notice, null);
  assert.equal(calls.filter((call) => call.method === "PUT").length, 0);
  stopPlanSync();
});

test("a plan made before accounts kept plans is saved to an account that has none", async () => {
  browserHas(plan("Old browser plan"), null);
  startPlanSync("user-a");
  await ready();
  await flushPlan();
  assert.equal(server.plan?.weddingDetails.coupleName, "Old browser plan");
  assert.equal(calls.find((call) => call.method === "PUT")?.baseRevision, 0);
  assert.deepEqual(store().planSync, { owner: "user-a", revision: 1, dirty: false });
  stopPlanSync();
});

test("when the account already has a plan, the account's plan wins and the user is told", async () => {
  server = { plan: plan("Saved in account"), revision: 2 };
  browserHas(plan("Old browser plan"), null);
  startPlanSync("user-a");
  await ready();
  assert.equal(coupleName(), "Saved in account");
  assert.match(usePlanStatus.getState().notice ?? "", /restored the plan saved in your account/);
  stopPlanSync();
});

test("your own unsaved changes from last time are uploaded if nothing newer was saved", async () => {
  server = { plan: plan("Before"), revision: 4 };
  browserHas(plan("Edited before the tab closed"), "user-a", 4, true);
  startPlanSync("user-a");
  await ready();
  await flushPlan();
  assert.equal(server.plan?.weddingDetails.coupleName, "Edited before the tab closed");
  assert.equal(server.revision, 5);
  stopPlanSync();
});

test("edits are saved; an edit based on an outdated copy loads the newer plan instead of overwriting it", async () => {
  server = { plan: plan("Start"), revision: 1 };
  startPlanSync("user-a");
  await ready();
  store().updateWeddingDetails({ coupleName: "Edit 1" });
  assert.equal(store().planSync.dirty, true);
  await flushPlan();
  assert.equal(server.plan?.weddingDetails.coupleName, "Edit 1");
  assert.deepEqual(store().planSync, { owner: "user-a", revision: 2, dirty: false });

  // Another device saves in between; this browser's next edit is refused and the newer plan is loaded.
  server = { plan: plan("From phone"), revision: 3 };
  store().updateWeddingDetails({ coupleName: "Stale laptop edit" });
  await flushPlan();
  assert.equal(server.plan?.weddingDetails.coupleName, "From phone");
  assert.equal(coupleName(), "From phone");
  assert.match(usePlanStatus.getState().notice ?? "", /changed on another device/);
  assert.deepEqual(store().planSync, { owner: "user-a", revision: 3, dirty: false });
  stopPlanSync();
});

test("Start Over clears the saved plan too, and loading a plan doesn't count as an edit", async () => {
  server = { plan: plan("Start"), revision: 1 };
  startPlanSync("user-a");
  await ready();
  assert.equal(calls.filter((call) => call.method === "PUT").length, 0, "applying the saved plan is not saved back");
  store().deleteAllPreferenceData();
  await flushPlan();
  assert.equal(planHasContent(server.plan!), false);
  stopPlanSync();
  // After signing out the browser's copy is removed; the account keeps its plan.
  clearLocalPlan();
  assert.equal(store().planSync.owner, null);
});

test("vendor and package names never leave the browser", async () => {
  server = { plan: plan("Start"), revision: 1 };
  startPlanSync("user-a");
  await ready();
  store().setSelectionAccess(() => true);
  store().selectPackage({ serviceId: 1, serviceName: "Venue", vendorId: 4, vendorName: "Secret Hall", packageId: 9, packageName: "Gold", unitPrice: 5000 });
  await flushPlan();
  const sent = calls.findLast((call) => call.method === "PUT")?.plan;
  assert.equal(sent?.selectedPackages[0]?.packageId, 9);
  assert.equal(sent?.selectedPackages[0]?.vendorName, "");
  assert.equal(sent?.selectedPackages[0]?.packageName, "");
  store().setSelectionAccess(() => false);
  stopPlanSync();
});

test("the shortlist is cleaned, capped at 30, and kept apart from the budget", async () => {
  const cleaned = normalizePlan({ ...plan("A"), shortlist: [
    { vendorId: 5, serviceId: 1 }, { vendorId: 5, serviceId: 1 }, { vendorId: -1, serviceId: 1 }, { vendorId: 6, serviceId: 99 },
    ...Array.from({ length: 40 }, (_, index) => ({ vendorId: 100 + index, serviceId: 2 })),
  ] });
  assert.equal(cleaned.shortlist.length, 30);
  assert.deepEqual(cleaned.shortlist[0], { vendorId: 5, serviceId: 1 });
  assert.equal(cleaned.shortlist.filter((entry) => entry.vendorId === 5).length, 1);
  assert.deepEqual(normalizePlan({ ...plan("B"), shortlist: undefined }).shortlist, [], "plans saved before shortlists existed still load");

  server = { plan: plan("Start"), revision: 1 };
  startPlanSync("user-a");
  await ready();
  assert.equal(store().toggleShortlist(7, 1), true);
  assert.deepEqual(store().shortlist, [{ vendorId: 7, serviceId: 1 }]);
  assert.deepEqual(store().selectedPackages, [], "shortlisting never chooses a package");
  await flushPlan();
  assert.deepEqual(server.plan?.shortlist, [{ vendorId: 7, serviceId: 1 }], "the shortlist is saved to the account");
  store().toggleShortlist(7, 1);
  assert.deepEqual(store().shortlist, []);
  for (let id = 1; id <= 30; id++) store().toggleShortlist(id, 1);
  assert.equal(store().toggleShortlist(31, 1), false, "a full shortlist refuses another vendor");
  assert.equal(store().shortlist.length, 30);
  store().removeFromShortlist([1, 2]);
  assert.equal(store().shortlist.length, 28);
  stopPlanSync();
});
