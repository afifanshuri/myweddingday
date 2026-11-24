import assert from "node:assert/strict";
import { test } from "node:test";
import { assertAdminUser, requireSameOrigin } from "../src/services/others/adminAuthService";
import { errorResponse, readBody, RequestError, validateCriteria, validatePackages, validatePreferences, validateVendor } from "../src/services/others/requestValidation";
import { cleanFileName, detectFileType } from "../src/services/others/fileTypes";

const vendor = { vendorName: "Example", serviceId: 1, locationId: [1], contact: "0123456789", detail: "Hall" };
const packages = [{ name: "Reception", price: 5000, details: "Reception package", filters: {} }];
const png = () => new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])], "photo.png", { type: "image/png" });

test("authorization rejects anonymous users and untrusted user roles", () => {
  assert.throws(() => assertAdminUser(null), (e: unknown) => e instanceof RequestError && e.status === 401);
  const forged = { app_metadata: {}, user_metadata: { role: "admin" } };
  assert.throws(() => assertAdminUser(forged), (e: unknown) => e instanceof RequestError && e.status === 403);
  assert.doesNotThrow(() => assertAdminUser({ app_metadata: { role: "admin" } }));
});

test("cross-origin writes are rejected", () => {
  assert.throws(() => requireSameOrigin(new Request("https://app.example/api/vendors", {
    headers: { origin: "https://other.example" },
  })), RequestError);
  assert.doesNotThrow(() => requireSameOrigin(new Request("https://app.example/api/vendors", {
    headers: { origin: "https://app.example" },
  })));
});

test("vendor validation rejects supplied rating, invalid IDs and unsafe links", () => {
  assert.throws(() => validateVendor({ ...vendor, rating: 5 }), /Rating/);
  assert.throws(() => validateVendor({ ...vendor, serviceId: 99 }), /service/);
  assert.throws(() => validateVendor({ ...vendor, locationId: [1.5] }), /ID/);
  assert.throws(() => validateVendor({ ...vendor, instagram: "javascript:alert(1)" }), /HTTP/);
  assert.equal(validateVendor({ ...vendor, vendorName: " Example " }).vendorName, "Example");
});

test("packages reject invalid prices and respect database string limits", () => {
  for (const price of [-1, 0, NaN, Infinity, "5000"]) {
    assert.throws(() => validatePackages([{ ...packages[0], price }], 1), RequestError);
  }
  assert.throws(() => validatePackages([{ ...packages[0], details: "x".repeat(1001) }], 1), RequestError);
  assert.throws(() => validatePackages([], 1), RequestError);
});

test("criteria reject unknown keys, invalid options and wrong types", () => {
  assert.throws(() => validateCriteria({ invented: true }, 1, "user"), /criterion/);
  assert.throws(() => validateCriteria({ seated_capacity: "100" }, 1, "user"), /value/);
  assert.throws(() => validateCriteria({ venue_type: "Invented" }, 1, "user"), /value/);
  assert.throws(() => validateCriteria({ accessibility: ["Invented"] }, 1, "user"), /value/);
});

test("hidden criteria are removed while false and zero are retained", () => {
  assert.deepEqual(validateCriteria({ provides_khemah: false, khemah_types: ["Dome"], seated_capacity: 0 }, 1, "user"), {
    provides_khemah: false, seated_capacity: 0,
  });
});

test("matching requests validate required fields and service uniqueness", () => {
  const preference = { serviceId: 1, budget: 5000, location: [1], criteria: { air_conditioned: false }, requiredFields: ["air_conditioned"] };
  assert.deepEqual(validatePreferences([preference]), [preference]);
  assert.throws(() => validatePreferences([{ ...preference, requiredFields: ["invented"] }]), /Required/);
  assert.throws(() => validatePreferences([preference, preference]), /Duplicate/);
});

test("request size is bounded even without Content-Length", async () => {
  const request = new Request("https://app.example", { method: "POST", body: "x".repeat(20) });
  await assert.rejects(readBody(request, 10), (e: unknown) => e instanceof RequestError && e.status === 413);
  const response = await readBody(new Request("https://app.example", { method: "POST", body: "{}" }), 10);
  assert.equal(await response.text(), "{}");
});

test("public errors preserve expected statuses without exposing internal details", async () => {
  const response = errorResponse(new RequestError("Bad request"), "Save failed");
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Bad request" });
  const internal = errorResponse(new Error("postgres://secret-password"), "Save failed");
  assert.equal(internal.status, 500);
  assert.deepEqual(await internal.json(), { error: "Save failed" });
});

test("file types come from the file's signature, not its name or declared type", () => {
  const bytes = (...values: number[]) => new Uint8Array([...values, ...new Array(16).fill(0)]);
  const text = (value: string) => new TextEncoder().encode(value);
  assert.equal(detectFileType(bytes(0xff, 0xd8, 0xff)), "image/jpeg");
  assert.equal(detectFileType(bytes(137, 80, 78, 71, 13, 10, 26, 10)), "image/png");
  assert.equal(detectFileType(text("RIFF----WEBPVP8 ")), "image/webp");
  assert.equal(detectFileType(text("%PDF-1.7 rest")), "application/pdf");
  assert.equal(detectFileType(text("MZ executable")), null);
  assert.equal(detectFileType(text("<html>")), null);
});

test("file names are cleaned for display", () => {
  const backslash = String.fromCharCode(92);
  assert.equal(cleanFileName(["C:", "Users", "me", "price list.pdf"].join(backslash), 200), "price list.pdf");
  assert.equal(cleanFileName("../../etc/passwd", 200), "passwd");
  assert.equal(cleanFileName(`a${String.fromCharCode(0)}b<>c.pdf`, 200), "abc.pdf");
  assert.equal(cleanFileName("", 200), "file");
  assert.equal(cleanFileName(`${"x".repeat(300)}.pdf`, 20), `${"x".repeat(16)}.pdf`);
});
