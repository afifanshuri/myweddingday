import assert from "node:assert/strict";
import { test } from "node:test";
import { manualSearchLimit, PLANS } from "../src/config/plans";
import { pickFreeUnlocks } from "../src/services/others/searchCap";

test("free accounts get one search, ever, unlocking one vendor per service", () => {
  assert.equal(PLANS.free.manualSearches, 1);
  assert.equal(PLANS.free.unlockedPerService, 1);
});

test("a free search unlocks the best vendor after each service's top pick, never a top pick", () => {
  const entry = (vendorId: number, serviceId: number, isTopPick = false) => ({ vendorId, serviceId, isTopPick });
  // Ranked as saved: top picks first in each service, services interleaved in any order.
  const matches = [entry(10, 1, true), entry(11, 1), entry(12, 1), entry(20, 2, true), entry(21, 2), entry(30, 3, true), entry(13, 1)];
  assert.deepEqual(pickFreeUnlocks(matches, 1), [11, 21]);
  assert.deepEqual(pickFreeUnlocks(matches, 2), [11, 12, 21]);
  // A service with only its top pick unlocks nothing; an empty search unlocks nothing.
  assert.deepEqual(pickFreeUnlocks([entry(30, 3, true)], 1), []);
  assert.deepEqual(pickFreeUnlocks([], 1), []);
});

test("free limits and paid/admin exemptions use shared plan configuration; AI remains disabled", () => {
  assert.equal(manualSearchLimit({ role: "user", isPaid: false }), PLANS.free.manualSearches);
  assert.equal(manualSearchLimit({ role: "user", isPaid: true }), null);
  assert.equal(manualSearchLimit({ role: "admin", isPaid: false }), null);
  assert.equal(PLANS.aiSearchEnabled, false);
});

test("refresh/retry reuses a persisted search ID; submission and changed input create a new ID", async () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } });
  const { usePreferenceStore: store } = await import("../src/store/preferenceStore");
  const first = store.getState().getManualSearchId("preferences", "user1");
  assert.equal(store.getState().manualSearch?.pending, true);
  assert.equal(typeof store.getState().manualSearch?.createdAt, "number");
  assert.equal(store.getState().getManualSearchId("preferences", "user1"), first);
  await store.persist.rehydrate();
  assert.equal(store.getState().getManualSearchId("preferences", "user1"), first);
  store.getState().completeManualSearch(first);
  await store.persist.rehydrate();
  assert.equal(store.getState().manualSearch?.pending, false);
  store.getState().beginManualSearch();
  assert.equal(store.getState().manualSearchRequested, true);
  const rerun = store.getState().getManualSearchId("preferences", "user1");
  assert.equal(store.getState().manualSearchRequested, false);
  assert.notEqual(rerun, first);
  assert.notEqual(store.getState().getManualSearchId("changed", "user1"), rerun);
  assert.notEqual(store.getState().getManualSearchId("changed", "user2"), rerun);
});
