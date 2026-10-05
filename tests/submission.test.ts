import assert from "node:assert/strict";
import { test } from "node:test";
import { assertAdminUser, requireSameOrigin } from "../src/services/adminAuthService";
import { errorResponse, readBody, RequestError, validateCriteria, validatePackages, validatePreferences, validateVendor } from "../src/services/requestValidation";
import { validateImage } from "../src/services/imageValidation";
import { createVendorWithPackages } from "../src/services/vendorSaveWorkflow";

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
  const preference = { serviceId: 1, budget: 5000, location: [1], criteria: { parking_available: false }, requiredFields: ["parking_available"] };
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

test("image validation checks MIME, signature and size", async () => {
  assert.equal(await validateImage(png()), "png");
  await assert.rejects(validateImage(new File(["not a PNG"], "photo.png", { type: "image/png" })), /Only/);
  await assert.rejects(validateImage(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "photo.png", { type: "image/png" })), /5 MB/);
});

test("successful workflow sends all packages to one save operation", async () => {
  let saves = 0;
  const result = await createVendorWithPackages(validateVendor(vendor), validatePackages(packages, 1), [png()], {
    upload: async () => "assets/packageImages/example.png",
    remove: async () => { assert.fail("Successful save must keep images"); },
    save: async (input, records) => {
      saves++;
      assert.equal(records.length, 1);
      assert.equal(records[0].filePath, "assets/packageImages/example.png");
      assert.equal(Object.hasOwn(input, "rating"), false);
      return { id: 1, vendorName: input.vendorName };
    },
  });
  assert.equal(saves, 1);
  assert.equal(result.id, 1);
});

test("database failure cleans uploaded images and propagates the failure", async () => {
  const failure = new Error("Database unavailable");
  const removed: string[] = [];
  await assert.rejects(createVendorWithPackages(validateVendor(vendor), validatePackages(packages, 1), [png()], {
    upload: async () => "assets/packageImages/example.png",
    remove: async (paths) => { removed.push(...paths); },
    save: async () => { throw failure; },
  }), (e: unknown) => e === failure);
  assert.deepEqual(removed, ["assets/packageImages/example.png"]);
});

test("partial upload failure cleans earlier images and never saves records", async () => {
  let uploads = 0;
  const removed: string[] = [];
  await assert.rejects(createVendorWithPackages(validateVendor(vendor), validatePackages([packages[0], packages[0]], 1), [png(), png()], {
    upload: async () => { if (++uploads === 2) throw new Error("Upload failed"); return "assets/packageImages/first.png"; },
    remove: async (paths) => { removed.push(...paths); },
    save: async () => { assert.fail("Must not save after upload failure"); },
  }), /Upload failed/);
  assert.deepEqual(removed, ["assets/packageImages/first.png"]);
});

test("invalid attachments are rejected before any upload or save", async () => {
  await assert.rejects(createVendorWithPackages(validateVendor(vendor), validatePackages(packages, 1), [new File(["fake"], "photo.png", { type: "image/png" })], {
    upload: async () => { assert.fail("Must validate before upload"); },
    remove: async () => { assert.fail("Nothing uploaded"); },
    save: async () => { assert.fail("Must validate before save"); },
  }), /Only/);
});
