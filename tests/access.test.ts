import assert from "node:assert/strict";
import { test } from "node:test";
import { getAccessForUser, canViewIdentity } from "../src/services/others/accessRules";
import { updateAccessMetadata } from "../src/services/others/adminUserRules";
import { projectVendorMatch } from "../src/services/others/vendorResponseService";
import { validateCriteria } from "../src/services/others/requestValidation";
import { SERVICE_CRITERIA } from "../src/config/serviceCriteria";
import { getBudgetSummary } from "../src/services/others/budgetService";
import type { VendorAndPackagesMatchDTOType } from "../src/types/dtoTypes";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const { registerHooks } = createRequire(import.meta.url)("node:module") as {
  registerHooks(hooks: { load(url: string, context: unknown, nextLoad: (url: string, context: unknown) => unknown): unknown }): { deregister(): void };
};

const now = Date.parse("2026-10-23T12:00:00Z");
const values = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key),
} });
const user = (metadata: Record<string, unknown>) => ({ id: "test-user", app_metadata: metadata });
test("guest, free, malformed roles, valid paid, admin and expiry boundaries", () => {
  assert.equal(getAccessForUser(null, now).canViewVendorIdentity, false);
  for (const role of [undefined, null, "ADMIN", {}, "vendor", "user"]) {
    const access = getAccessForUser(user({ role }), now);
    assert.equal(access.role, "user"); assert.equal(access.canViewVendorIdentity, false);
  }
  const paid = getAccessForUser(user({ paid_until: "2027-10-23T12:00:00Z" }), now);
  assert.equal(canViewIdentity(paid, now), true);
  assert.equal(canViewIdentity(paid, Date.parse(paid.paidUntil!)), false);
  assert.equal(getAccessForUser(user({ role: "admin", paid_until: "bad" }), now).canViewVendorIdentity, true);
});
test("malformed, ambiguous and expired timestamps fail closed", () => {
  for (const paid_until of [null, {}, 9999999999999, "2027-02-30T00:00:00Z", "2027-13-01T00:00:00Z", "2027-01-01", "2027-01-01T00:00:00", "2027-01-01T24:00:00Z", "yesterday", "2026-10-23T12:00:00Z", "2025-01-01T00:00:00Z"]) {
    assert.equal(getAccessForUser(user({ paid_until }), now).canViewVendorIdentity, false, JSON.stringify(paid_until));
  }
  assert.equal(getAccessForUser(user({ paid_until: "2027-01-01T08:00:00+08:00" }), now).isPaid, true);
});
test("user-editable metadata cannot authorize", () => {
  const forged = { ...user({}), user_metadata: { role: "admin", paid_until: "2099-01-01T00:00:00Z" } };
  assert.equal(getAccessForUser(forged, now).canViewVendorIdentity, false);
});
test("locked projection has a strict allowlist and never includes package records", () => {
  const match = { vendor: { id: 1, serviceId: 1, rating: 4.5, imageUrls: ["https://example.test/image.jpg"],
    vendorName: "SECRET_NAME", contact: "SECRET_CONTACT", detail: "SECRET_DETAIL", instagram: "SECRET_SOCIAL", filePath: "SECRET_FILE" },
    packages: [{ id: 1, packageName: "SECRET_PACKAGE", details: "SECRET_DESCRIPTION", price: 400 }, { price: 200 }] } as VendorAndPackagesMatchDTOType;
  const preview = projectVendorMatch(match, false);
  assert.deepEqual(Object.keys(preview).sort(), ["cheapestPrice", "identityLocked", "vendor"]);
  assert.deepEqual(Object.keys(preview.vendor).sort(), ["id", "imageUrls", "rating", "serviceId"]);
  assert.equal(JSON.stringify(preview).includes("SECRET"), false);
  assert.equal("packages" in preview, false);
  assert.equal(preview.identityLocked && preview.cheapestPrice, 200);
  const detailed = projectVendorMatch(match, true);
  assert.equal(detailed.identityLocked, false);
  assert.ok(!detailed.identityLocked && detailed.vendor.vendorName === "SECRET_NAME");
});
test("admin updates preserve metadata, validate actions and prevent self-demotion", () => {
  const original = { provider: "email", custom: "keep", role: "user" };
  assert.deepEqual(updateAccessMetadata(original, { action: "setRole", role: "admin" }, "actor", "other"), { ...original, role: "admin" });
  for (const body of [{ action: "setRole", role: "vendor" }, { action: "grantPass", role: "admin" }, { action: "invalid" }, null]) {
    assert.throws(() => updateAccessMetadata(original, body, "actor", "other"));
  }
  assert.throws(() => updateAccessMetadata(original, { action: "setRole", role: "user" }, "actor", "actor"));
  const grant = updateAccessMetadata(original, { action: "grantPass" }, "actor", "other", new Date("2024-02-29T10:00:00Z"));
  assert.equal(grant.paid_until, "2025-02-28T10:00:00.000Z");
  assert.equal(grant.custom, "keep");
  assert.equal(updateAccessMetadata(grant, { action: "revokePass" }, "actor", "other").paid_until, null);
});
test("admin-only criteria cannot be submitted by customers", () => {
  for (const [id, fields] of Object.entries(SERVICE_CRITERIA)) {
    for (const field of fields.filter((field) => field.user_mode === "admin")) {
      assert.throws(() => validateCriteria({ [field.key]: true }, Number(id), "user"));
    }
  }
});
test("budget remains accurate for catering and other selected packages", () => {
  const selections = [{ serviceId: 1, serviceName: "Venue", vendorId: 1, vendorName: "Vendor", packageId: 1, packageName: "Package", unitPrice: 1000 },
    { serviceId: 3, serviceName: "Catering", vendorId: 2, vendorName: "Vendor 2", packageId: 2, packageName: "Menu", unitPrice: 12.50 }];
  const budgets = [{ serviceId: 1, budget: 2000, description: "", criteria: {} }, { serviceId: 3, budget: 20, description: "", criteria: {} }];
  const result = getBudgetSummary([1, 3], budgets, selections, 100);
  assert.equal(result.selectedSen, 225000); assert.equal(result.plannedSen, 400000); assert.equal(result.remainingSen, 175000);
  assert.equal(getBudgetSummary([1, 3], budgets, [], 100).selectedSen, 0);
});

test("locked cards render dummy text; the only control is a shortlist bookmark that names no vendor", async () => {
  const hooks = registerHooks({ load(url, context, nextLoad) {
    if (url.endsWith(".css")) return { format: "module", source: "export default {};", shortCircuit: true };
    return nextLoad(url, context);
  } });
  try {
    const { default: VendorContainer } = await import("../src/components/matchComponents/VendorContainer");
    const match = { identityLocked: true as const, vendor: { id: 1, serviceId: 1, rating: 4.5, imageUrls: [] }, cheapestPrice: 1000 };
    const markup = renderToStaticMarkup(createElement(VendorContainer, { match, serviceName: "Venue", onSelect: () => { throw new Error("Locked cards must not open"); } }));
    assert.match(markup, /<article/);
    assert.match(markup, /locked-vendor-placeholder/);
    assert.match(markup, /Vendor name locked/);
    assert.match(markup, /Vendor contacts locked/);
    // The card itself can't be opened and invites nothing; the only control is the shortlist bookmark, outside the card.
    const card = markup.match(/<article[\s\S]*<\/article>/)![0];
    assert.doesNotMatch(card, /<button|<a\s|tabindex|role="button"|View packages|hover:/i);
    const outside = markup.replace(card, "");
    assert.equal(outside.match(/<button/g)?.length, 1);
    assert.match(outside, /aria-label="Add this venue vendor to your shortlist"/, "the bookmark names no vendor");
    assert.doesNotMatch(outside, /<a\s|View packages|In budget/i);
    assert.match(markup, /4.5/);
  } finally { hooks.deregister(); }
});

test("package selection guard, logout redaction and old storage migration", async () => {
  const { usePreferenceStore: store } = await import("../src/store/preferenceStore");
  store.getState().deleteAllPreferenceData();
  store.getState().updateWeddingDetails({ services: [1] });
  const pkg = { serviceId: 1, serviceName: "Venue", vendorId: 1, vendorName: "SECRET_VENDOR", packageId: 1, packageName: "SECRET_PACKAGE", unitPrice: 1000 };
  store.getState().setSelectionAccess(() => false);
  store.getState().selectPackage(pkg);
  assert.equal(store.getState().selectedPackages.length, 0);
  store.getState().setSelectionAccess(() => true);
  store.getState().selectPackage(pkg);
  store.getState().selectPackage({ ...pkg, packageId: 2 });
  assert.equal(store.getState().selectedPackages.length, 1);
  assert.equal(store.getState().selectedPackages[0].packageId, 2);
  assert.equal(values.get("preference-storage")!.includes("SECRET"), false);
  store.getState().redactSelectedPackages();
  store.getState().setSelectionAccess(() => false);
  assert.equal(store.getState().selectedPackages[0].vendorName, "");
  assert.equal(store.getState().selectedPackages[0].packageName, "");
  const state = JSON.parse(values.get("preference-storage")!).state;
  values.set("preference-storage", JSON.stringify({ version: 0, state: { ...state, selectedPackages: [pkg] } }));
  await store.persist.rehydrate();
  assert.equal(store.getState().selectedPackages[0].vendorName, "");
  assert.equal(values.get("preference-storage")!.includes("SECRET"), false);
  store.getState().removeSelectedPackage(1);
  assert.equal(store.getState().selectedPackages.length, 0);
});
