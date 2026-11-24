import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { vendorMessages } from "../src/services/others/vendorMessages";
import { SUBMISSION_TOKEN_PATTERN, vendorSubmitRoute } from "../src/config/submissionLinks";
import { ROUTES, getRouteRequirement, getSafeReturnPath } from "../src/config/routes";
import { optionalText, pathId, RequestError } from "../src/services/others/requestValidation";

test("submission tokens are 32 random bytes in base64url, and other strings are rejected", () => {
  for (let i = 0; i < 20; i++) assert.match(randomBytes(32).toString("base64url"), SUBMISSION_TOKEN_PATTERN);
  for (const bad of ["", "abc", "x".repeat(42), "x".repeat(44), `${"x".repeat(42)}/`, `${"x".repeat(42)}=`, `${"x".repeat(42)}%`]) {
    assert.equal(SUBMISSION_TOKEN_PATTERN.test(bad), false, bad);
  }
  assert.equal(vendorSubmitRoute("abc"), "/vendor-submit/abc");
});

test("vendor messages include what the vendor needs", () => {
  const expiresAt = new Date("2026-12-06T04:00:00Z");
  const invite = vendorMessages.invite({ label: "Dewan Kenanga", url: "https://example.test/vendor-submit/t", expiresAt });
  assert.match(invite.body, /Dewan Kenanga/);
  assert.match(invite.body, /https:\/\/example\.test\/vendor-submit\/t/);
  assert.match(invite.body, /6 December 2026/);
  const fix = vendorMessages.fixRequested({ vendorName: "Dewan Kenanga", note: "Add hall photos", url: "https://example.test/x", expiresAt });
  assert.match(fix.body, /Add hall photos/);
  assert.match(fix.body, /https:\/\/example\.test\/x/);
  assert.match(vendorMessages.rejected({ vendorName: "A", reason: "Prices missing" }).body, /Reason: Prices missing/);
  assert.doesNotMatch(vendorMessages.rejected({ vendorName: "A", reason: null }).body, /Reason:/);
  assert.match(vendorMessages.approved({ vendorName: "A" }).body, /approved/);
});

test("admin links page needs admin; the vendor page has no sign-in requirement and is never a return path", () => {
  assert.equal(getRouteRequirement(ROUTES.adminLinks), "admin");
  assert.equal(getRouteRequirement(vendorSubmitRoute("x".repeat(43))), null);
  assert.equal(getSafeReturnPath(vendorSubmitRoute("x".repeat(43))), null);
});

test("request helpers", () => {
  assert.equal(pathId("12"), 12);
  for (const bad of ["0", "012", "-1", "1.5", "abc", "2147483648"]) assert.throws(() => pathId(bad), RequestError);
  assert.equal(optionalText(undefined, "Email", 10), null);
  assert.equal(optionalText("   ", "Email", 10), null);
  assert.equal(optionalText(" a@b.co ", "Email", 10), "a@b.co");
  assert.throws(() => optionalText("x".repeat(11), "Email", 10), RequestError);
  assert.throws(() => optionalText(5, "Email", 10), RequestError);
});

test("submission links migration keeps the tables away from browser roles", () => {
  const sql = readFileSync(new URL("../migrations/20261122093708_vendor_submission_links/migration.sql", import.meta.url), "utf8");
  assert.match(sql, /"token_hash" varchar\(64\) NOT NULL UNIQUE/);
  assert.match(sql, /REVOKE ALL ON public\.vendor_submission_links, public\.public_request_limits FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /ON DELETE SET NULL/);
});
