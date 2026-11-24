import assert from "node:assert/strict";
import { test } from "node:test";

test("selected names migrate, persist, sync and clear without changing search identity", async () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } });
  const search = { id: "existing-search-id", input: "unchanged-preferences", userId: "account" };
  values.set("preference-storage", JSON.stringify({ version: 1, state: {
    weddingDetails: { coupleName: "Test Couple", date: null, locations: [1], pax: 100, services: [3, 6] },
    preferencesList: [{ serviceId: 3, budget: 1500, criteria: {}, requiredFields: [] }],
    selectedPackages: [], manualSearch: search,
  } }));
  const { usePreferenceStore: store } = await import("../src/store/preferenceStore");
  await store.persist.rehydrate();
  assert.deepEqual(store.getState().weddingDetails.serviceNames, {});
  assert.deepEqual(store.getState().weddingDetails.services, [3, 6]);
  assert.equal(store.getState().weddingDetails.coupleName, "Test Couple");
  assert.equal(store.getState().preferencesList[0].budget, 1500);
  assert.deepEqual(store.getState().manualSearch, search);

  const catalogue = [{ id: 3, serviceName: "Catering" }, { id: 6, serviceName: "MUA" }, { id: 2, serviceName: "Pelamin" }];
  const ids = store.getState().weddingDetails.services;
  store.getState().syncServiceNames(catalogue);
  assert.deepEqual(store.getState().weddingDetails.serviceNames, { 3: "Catering", 6: "MUA" });
  assert.equal(store.getState().weddingDetails.services, ids, "Label updates must not replace selected IDs and retrigger matching");
  assert.deepEqual(store.getState().manualSearch, search);
  const unchanged = store.getState();
  store.getState().syncServiceNames(catalogue);
  assert.equal(store.getState(), unchanged, "Identical catalogue must not cause repeated store updates");

  const persisted = values.get("preference-storage")!;
  assert.equal(JSON.parse(persisted).version, 3);
  // Plans saved before accounts kept them belong to no one until the next sign-in.
  assert.deepEqual(JSON.parse(persisted).state.planSync, { owner: null, revision: 0, dirty: false });
  store.getState().deleteAllPreferenceData();
  assert.deepEqual(store.getState().weddingDetails.serviceNames, {});
  values.set("preference-storage", persisted);
  await store.persist.rehydrate();
  assert.deepEqual(store.getState().weddingDetails.serviceNames, { 3: "Catering", 6: "MUA" });
  assert.deepEqual(store.getState().manualSearch, search);

  store.getState().syncServiceNames([{ id: 3, serviceName: "Updated Catering" }]);
  assert.deepEqual(store.getState().weddingDetails.serviceNames, { 3: "Updated Catering", 6: "MUA" });
  store.getState().updateWeddingDetails({ services: [3] });
  assert.deepEqual(store.getState().weddingDetails.serviceNames, { 3: "Updated Catering" });
  store.getState().updateWeddingDetails({ services: [3, 2], serviceNames: { 3: "Catering", 2: "Pelamin", 6: "MUA" } });
  assert.deepEqual(store.getState().weddingDetails.serviceNames, { 3: "Catering", 2: "Pelamin" });
  assert.deepEqual(store.getState().manualSearch, search);
  store.getState().deleteAllPreferenceData();
  assert.deepEqual(store.getState().weddingDetails.serviceNames, {});
  assert.deepEqual(store.getState().weddingDetails.services, []);
});
