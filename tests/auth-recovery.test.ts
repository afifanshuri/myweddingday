import test from "node:test";
import assert from "node:assert/strict";
import { LOGIN_NOTICES, PASSWORD_RULES, loginNotice } from "../src/config/auth";
import { ROUTES, getRouteRequirement, getSafeReturnPath } from "../src/config/routes";

test("login notices are allow-listed", () => {
  assert.equal(loginNotice("link-invalid"), LOGIN_NOTICES["link-invalid"]);
  assert.equal(loginNotice("password-updated"), LOGIN_NOTICES["password-updated"]);
  for (const value of [null, undefined, "", "toString", "__proto__", "<script>", ["link-invalid"]]) assert.equal(loginNotice(value), null, String(value));
});

test("recovery pages have the expected access and the confirm handler is not a return target", () => {
  assert.equal(getRouteRequirement(ROUTES.forgotPassword), "guestOnly");
  assert.equal(getRouteRequirement(ROUTES.resetPassword), "signedIn");
  assert.equal(getRouteRequirement(ROUTES.authConfirm), null);
  assert.equal(getSafeReturnPath(ROUTES.authConfirm), null);
  assert.ok(PASSWORD_RULES.minLength >= 6);
});
