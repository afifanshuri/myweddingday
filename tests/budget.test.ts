import assert from "node:assert/strict";
import { test } from "node:test";
import { getBudgetSummary, getCostInSen } from "../src/services/others/budgetService";
import type { SelectedPackage } from "../src/types/preferenceTypes";

const venue: SelectedPackage = { serviceId: 1, serviceName: "Venue", vendorId: 1, vendorName: "Venue A", packageId: 1, packageName: "Hall", unitPrice: 2500 };
const catering: SelectedPackage = { ...venue, serviceId: 3, serviceName: "Catering", packageId: 2, unitPrice: 10.25 };
const preferences = [
  { serviceId: 1, budget: 5000, description: "", criteria: {} },
  { serviceId: 3, budget: 12.5, description: "", criteria: {} },
];

test("budget totals multiply catering by guests and retain exact sen", () => {
  const summary = getBudgetSummary([1, 3], preferences, [venue, catering], 200);
  assert.equal(summary.plannedSen, 750000);
  assert.equal(summary.selectedSen, 455000);
  assert.equal(summary.remainingSen, 295000);
  assert.equal(getCostInSen(1, 0.1 + 0.2, 0), 30);
});

test("partial selections, over-budget totals and removed services", () => {
  assert.equal(getBudgetSummary([1, 3], preferences, [venue], 200).selectedSen, 250000);
  const over = getBudgetSummary([1, 3], preferences, [{ ...venue, unitPrice: 8000 }], 200);
  assert.equal(over.remainingSen, -50000);
  assert.equal(getBudgetSummary([1], preferences, [venue, catering], 200).selections.length, 1);
});

test("missing budgets and invalid catering guest counts never produce misleading totals", () => {
  const missing = getBudgetSummary([1, 3], preferences, [venue, catering], 0);
  assert.equal(missing.plannedSen, null);
  assert.equal(missing.selectedSen, null);
  assert.equal(missing.remainingSen, null);
  assert.equal(getBudgetSummary([1, 3], preferences.slice(0, 1), [venue], 200).plannedSen, null);
  assert.equal(getCostInSen(3, 10, 1.5), null);
  assert.equal(getCostInSen(1, NaN, 200), null);
});

test("selection replaces per service, persists, removes, prunes and resets", async () => {
  const saved = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => saved.set(key, value),
    removeItem: (key: string) => saved.delete(key),
  } });
  const { usePreferenceStore: store } = await import("../src/store/preferenceStore");
  store.getState().setSelectionAccess(() => true);
  store.getState().updateWeddingDetails({ services: [1, 3], pax: 200 });
  store.getState().selectPackage(venue);
  store.getState().selectPackage(catering);
  store.getState().selectPackage({ ...venue, vendorId: 7, packageId: 7, unitPrice: 3000 });
  assert.equal(store.getState().selectedPackages.length, 2);
  assert.equal(store.getState().selectedPackages.find((pkg) => pkg.serviceId === 1)?.packageId, 7);
  const snapshot = saved.get("preference-storage")!;
  store.getState().deleteAllPreferenceData();
  saved.set("preference-storage", snapshot);
  await store.persist.rehydrate();
  assert.equal(store.getState().selectedPackages.length, 2);
  store.getState().removeSelectedPackage(1);
  assert.equal(store.getState().selectedPackages.length, 1);
  store.getState().updateWeddingDetails({ services: [1] });
  assert.deepEqual(store.getState().selectedPackages, []);
  store.getState().selectPackage(venue);
  store.getState().deleteAllPreferenceData();
  assert.deepEqual(store.getState().selectedPackages, []);
  saved.set("preference-storage", JSON.stringify({ state: { weddingDetails: { coupleName: "", date: null, locations: [], pax: 0, services: [] }, preferencesList: [] }, version: 0 }));
  await store.persist.rehydrate();
  assert.deepEqual(store.getState().selectedPackages, []);
});
