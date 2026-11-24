import assert from "node:assert/strict";
import { test } from "node:test";
import { ROUTES, PAGE_ACCESS, getRouteRequirement, getDefaultRoute, getSafeReturnPath, paymentRoute, canAccessRoute } from "../src/config/routes";
import { getAccessForUser } from "../src/services/others/accessRules";
import { projectVendorMatch } from "../src/services/others/vendorResponseService";
import type { VendorAndPackagesMatchDTOType } from "../src/types/dtoTypes";

const guest = getAccessForUser(null);
const free = getAccessForUser({ id: "free", app_metadata: { role: "user" } });
const paid = getAccessForUser({ id: "paid", app_metadata: { role: "user", paid_until: "2099-01-01T00:00:00Z" } });
const admin = getAccessForUser({ id: "admin", app_metadata: { role: "admin" } });

test("route requirements and role defaults", () => {
  assert.equal(getDefaultRoute(free), ROUTES.dashboard);
  assert.equal(getDefaultRoute(admin), ROUTES.admin);
  for (const route of [ROUTES.dashboard, ROUTES.weddingPlan, ROUTES.payment]) assert.equal(PAGE_ACCESS[route], "signedIn");
  for (const route of [ROUTES.admin, ROUTES.adminUsers]) assert.equal(PAGE_ACCESS[route], "admin");
  assert.equal(getRouteRequirement("/weddingplan/6"), "signedIn");
  assert.equal(getRouteRequirement("/weddingplan/7"), null);
  assert.equal(getRouteRequirement("/administrator"), null);
  assert.equal(getRouteRequirement("/admin/not-a-page"), null);
  assert.equal(getRouteRequirement("/match/1"), "paid");
});
test("unsafe and unknown return destinations are rejected", () => {
  for (const path of [undefined, ["/match"], "https://evil.test", "//evil.test", "/\\evil.test", "/%2f%2fevil.test", "/admin%2fusers", "/api/admin/users", "/login", "/login?next=/match", "/", "/#pricing", "/does-not-exist", "/weddingplan/0", "/match?next=https://evil.test", "/payment?returnTo=/payment", "/payment?returnTo=/match&returnTo=/admin", "/payment?returnTo=" + encodeURIComponent("/payment?returnTo=/match"), "/match\n"]) {
    assert.equal(getSafeReturnPath(path), null, String(path));
  }
  for (const path of ["/match", "/dashboard", "/admin/users", "/weddingplan/1"]) assert.equal(getSafeReturnPath(path), path);
  assert.equal(getSafeReturnPath(paymentRoute()), "/payment?returnTo=%2Fmatch");
});
test("first-login navigation uses strict true; role authorization stays separate", () => {
  assert.equal(getDefaultRoute(free, true), ROUTES.weddingPlan);
  assert.equal(getDefaultRoute(paid, true), ROUTES.weddingPlan);
  for (const value of [undefined, null, false, "true", "false", 1, {}, []]) {
    assert.equal(getDefaultRoute(free, value), ROUTES.dashboard);
    assert.equal(getDefaultRoute(paid, value), ROUTES.dashboard);
  }
  assert.equal(getDefaultRoute(admin, true), ROUTES.admin);
  assert.equal(getDefaultRoute(guest, true), ROUTES.dashboard);
  assert.equal(canAccessRoute(admin, "/weddingplan"), true);
  assert.equal(canAccessRoute(admin, "/match"), true);
  assert.equal(canAccessRoute(guest, "/weddingplan"), false);
  assert.equal(canAccessRoute(guest, "/match"), true);
  assert.equal(canAccessRoute(free, "/payment"), true);
  assert.equal(canAccessRoute(free, "/admin/users"), false);
  assert.equal(canAccessRoute(free, "/match/1"), false);
  assert.equal(canAccessRoute(paid, "/match/1"), true);
});

function match(id: number, serviceId: number): VendorAndPackagesMatchDTOType {
  return { vendor: { id, serviceId, vendorName: `SECRET_VENDOR_${id}`, contact: "SECRET_CONTACT", rating: 4, imageUrls: [],
    createdAt: new Date(), locationId: [1], detail: null, instagram: null, facebook: null, tiktok: null, filePath: null, imagePaths: [],
    status: "approved", reviewNote: "SECRET_NOTE", reviewedAt: null },
    packages: [{ id, price: id * 100, packageName: "SECRET_PACKAGE", createdAt: new Date(), details: null, duration: null, vendorId: id, filters: {},
      attachments: [{ name: "SECRET_FILE.pdf", kind: "pdf", size: 1, url: "https://example.test/SECRET_FILE" }] }] };
}
test("locked previews never include names, contacts, packages, files or review notes", () => {
  const matches = [match(1, 1), match(2, 1), match(4, 2)];
  const previews = matches.map((item) => projectVendorMatch(item, false));
  assert.equal(JSON.stringify(previews).includes("SECRET"), false);
  assert.ok(previews.every((item) => item.identityLocked && !("packages" in item)));
  assert.deepEqual(previews.map((item) => item.identityLocked && item.cheapestPrice), [100, 200, 400]);
});
test("full details include packages and files but never admin review notes", () => {
  const full = projectVendorMatch(match(1, 1), true);
  assert.equal(full.identityLocked, false);
  assert.ok(JSON.stringify(full).includes("SECRET_PACKAGE") && JSON.stringify(full).includes("SECRET_FILE"));
  assert.equal(JSON.stringify(full).includes("SECRET_NOTE"), false);
});
