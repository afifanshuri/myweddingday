import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { expectedUploads, planVendorFiles, validateFileRefs, type CurrentFiles } from "../src/services/others/vendorFilesPlan";
import { RequestError } from "../src/services/others/requestValidation";
import { ROUTES, adminVendorRoute, getRouteRequirement, getSafeReturnPath } from "../src/config/routes";
import type { StoredAttachment } from "../src/config/uploads";

const file = (path: string, name = path.split("/").pop()!): StoredAttachment => ({ path, name, kind: path.endsWith(".pdf") ? "pdf" : "image", size: 10 });
const current: CurrentFiles = {
  imagePaths: ["assets/vendorImages/a.png", "assets/vendorImages/b.png"],
  packages: [
    { id: 10, attachments: [file("assets/packageImages/p10.png"), file("assets/packageFiles/p10.pdf")] },
    { id: 11, attachments: [file("assets/packageFiles/p11.pdf")] },
    { id: 12, attachments: [] },
  ],
};
const uploads = new Map([
  ["u-photo", { path: "assets/vendorImages/new.webp", name: "new.webp", contentType: "image/webp" as const, size: 300 }],
  ["u-pdf", { path: "assets/packageFiles/new.pdf", name: "Price list.pdf", contentType: "application/pdf" as const, size: 900 }],
]);

test("edit keeps, adds and removes files, deletes missing packages, and lists unused files for cleanup", () => {
  const images = [{ path: "assets/vendorImages/b.png" }, { upload: "u-photo" }];
  // 10: keep the PDF, drop the old image, add a new PDF; 11: drop its PDF; 12: deleted; plus a new package.
  const packages = [
    { id: 10, attachments: [{ path: "assets/packageFiles/p10.pdf" }, { upload: "u-pdf" }] },
    { id: 11, attachments: [] },
    { attachments: [] },
  ];
  const plan = planVendorFiles(current, images, packages, uploads);
  assert.deepEqual(plan.imagePaths, ["assets/vendorImages/b.png", "assets/vendorImages/new.webp"]);
  assert.deepEqual(plan.attachments[0], [file("assets/packageFiles/p10.pdf"),
    { path: "assets/packageFiles/new.pdf", name: "Price list.pdf", kind: "pdf", size: 900 }]);
  assert.deepEqual(plan.attachments.slice(1), [[], []]);
  assert.deepEqual(plan.deletedPackageIds, [12]);
  assert.deepEqual(plan.removed.sort(), ["assets/packageFiles/p11.pdf", "assets/packageImages/p10.png", "assets/vendorImages/a.png"]);
});

test("an edit that keeps everything removes nothing", () => {
  const plan = planVendorFiles(current, current.imagePaths.map((path) => ({ path })),
    current.packages.map((pkg) => ({ id: pkg.id, attachments: pkg.attachments.map(({ path }) => ({ path })) })), new Map());
  assert.deepEqual(plan.removed, []);
  assert.deepEqual(plan.deletedPackageIds, []);
});

test("saved files can't move between vendors, packages or kinds, and limits apply", () => {
  const keepAll = current.packages.map((pkg) => ({ id: pkg.id, attachments: [] as { path: string }[] }));
  // Another vendor's file, a package file used as a vendor photo, an attachment moved to another package, a file used twice.
  assert.throws(() => planVendorFiles(current, [{ path: "assets/vendorImages/other.png" }], keepAll, uploads), RequestError);
  assert.throws(() => planVendorFiles(current, [{ path: "assets/packageFiles/p11.pdf" }], keepAll, uploads), RequestError);
  assert.throws(() => planVendorFiles(current, [], [{ id: 10, attachments: [{ path: "assets/packageFiles/p11.pdf" }] }], uploads), RequestError);
  assert.throws(() => planVendorFiles(current, [{ path: "assets/vendorImages/a.png" }, { path: "assets/vendorImages/a.png" }], keepAll, uploads), RequestError);
  // A new package can't claim saved files; unknown or duplicate package ids are refused.
  assert.throws(() => planVendorFiles(current, [], [{ attachments: [{ path: "assets/packageFiles/p11.pdf" }] }], uploads), RequestError);
  assert.throws(() => planVendorFiles(current, [], [{ id: 99, attachments: [] }], uploads), /Unknown package/);
  assert.throws(() => planVendorFiles(current, [], [{ id: 10, attachments: [] }, { id: 10, attachments: [] }], uploads), /Unknown package/);
  // An upload that wasn't verified (expired, or someone else's) is refused.
  assert.throws(() => planVendorFiles(current, [{ upload: "u-missing" }], keepAll, uploads), /expired/);
  // Limits.
  assert.throws(() => planVendorFiles({ imagePaths: [], packages: [] }, Array.from({ length: 7 }, () => ({ upload: "u-photo" })), [], uploads), /at most 6/);
  assert.throws(() => planVendorFiles({ imagePaths: [], packages: [] }, [], [{ attachments: Array.from({ length: 6 }, () => ({ upload: "u-pdf" })) }], uploads), /at most 5/);
});

test("uploads must be used once and as the right kind", () => {
  const expected = expectedUploads([{ upload: "a" }, { path: "assets/vendorImages/a.png" }], [{ attachments: [{ upload: "b" }] }]);
  assert.deepEqual([...expected], [["a", "vendorImage"], ["b", "packageFile"]]);
  assert.throws(() => expectedUploads([{ upload: "a" }], [{ attachments: [{ upload: "a" }] }]), /used twice/);
});

test("file references are either a saved path or an upload id", () => {
  assert.deepEqual(validateFileRefs([{ path: "assets/vendorImages/a.png" }, { upload: "abc" }], 5, "files"), [{ path: "assets/vendorImages/a.png" }, { upload: "abc" }]);
  assert.deepEqual(validateFileRefs(undefined, 5, "files"), []);
  assert.throws(() => validateFileRefs([{ path: "x", upload: "y" }], 5, "files"), RequestError);
  assert.throws(() => validateFileRefs([{ path: 5 }], 5, "files"), RequestError);
  assert.throws(() => validateFileRefs([{}, {}], 1, "files"), /At most 1/);
  assert.throws(() => validateFileRefs("x", 5, "files"), RequestError);
});

test("admin vendor pages require admin access", () => {
  assert.equal(getRouteRequirement(ROUTES.admin), "admin");
  assert.equal(getRouteRequirement(ROUTES.adminNewVendor), "admin");
  assert.equal(getRouteRequirement(adminVendorRoute(12)), "admin");
  assert.equal(getRouteRequirement("/admin/vendors/0"), null);
  assert.equal(getRouteRequirement("/admin/vendors/abc"), null);
  assert.equal(getSafeReturnPath(adminVendorRoute(12)), "/admin/vendors/12");
});

test("listing status values and migration backfill", async () => {
  const { isVendorStatus } = await import("../src/config/vendorStatus");
  assert.ok(["pending", "approved", "rejected"].every(isVendorStatus));
  assert.equal(isVendorStatus("deleted"), false);
  assert.equal(isVendorStatus(undefined), false);
  const sql = readFileSync(new URL("../migrations/20261122082808_vendor_listing_status/migration.sql", import.meta.url), "utf8");
  // Existing vendors must be filled in as approved before the default becomes pending.
  assert.ok(sql.indexOf(`ADD COLUMN "status" varchar(10) DEFAULT 'approved' NOT NULL`) >= 0);
  assert.ok(sql.indexOf(`ADD COLUMN "status"`) < sql.indexOf(`SET DEFAULT 'pending'`));
});

test("attachments migration moves old package images before dropping the column", () => {
  const [move, drop] = ["20261122104642_package_attachments_direct_uploads", "20261122104652_drop_package_file_path"]
    .map((name) => readFileSync(new URL(`../migrations/${name}/migration.sql`, import.meta.url), "utf8"));
  assert.match(move, /SET "attachments" = jsonb_build_array\(jsonb_build_object\(\s*'path', "filePath"/);
  assert.match(move, /REVOKE ALL ON public\.pending_uploads FROM PUBLIC, anon, authenticated/);
  assert.match(move, /allowed_mime_types = ARRAY\['image\/jpeg', 'image\/png', 'image\/webp', 'application\/pdf'\]/);
  assert.match(drop, /DROP COLUMN "filePath"/);
});
