import { sql } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import type { VendorStatus } from "@/config/vendorStatus";
import type { SubmissionLinkState } from "@/config/submissionLinks";
import type { StoredAttachment, UploadKind } from "@/config/uploads";
import {
  check,
  index,
  integer,
  pgTable,
  varchar,
  numeric,
  timestamp,
  jsonb,
  uuid,
  date,
  primaryKey,
} from "drizzle-orm/pg-core";

export const timestamps = {
  updated_at: timestamp(),
  created_at: timestamp().defaultNow().notNull(),
  deleted_at: timestamp(),
};

// Additive replacement: legacy full snapshots remain untouched for rollback.
export const manualSearchSnapshots = pgTable("manual_search_snapshots", {
  userId: uuid("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  searchId: uuid("search_id").notNull(),
  fingerprint: varchar("fingerprint", { length: 64 }).notNull(),
  matches: jsonb("matches").$type<import("@/types/search").SnapshotMatch[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.searchId] }),
  index("manual_search_snapshots_expiry_idx").on(table.expiresAt),
  check("manual_search_snapshots_matches_check", sql`jsonb_typeof(${table.matches}) = 'array'`),
]).enableRLS();

export const searchRequestLimits = pgTable("search_request_limits", {
  userId: uuid("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 16 }).notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  requests: integer("requests").notNull().default(1),
}, (table) => [primaryKey({ columns: [table.userId, table.action] })]).enableRLS();

const servicesTable = pgTable("servicesTable", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp().defaultNow().notNull(),
  serviceName: varchar({ length: 255 }).notNull(),
}).enableRLS();

const locationTable = pgTable("locationTable", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp().defaultNow().notNull(),
  locationName: varchar({ length: 255 }).notNull(),
}).enableRLS();

const vendorsTable = pgTable("vendorsTable", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp().defaultNow().notNull(),
  vendorName: varchar({ length: 255 }).notNull(),
  serviceId: integer()
    .notNull()
    .references(() => servicesTable.id),
  locationId: integer().array().notNull(),
  detail: varchar({ length: 500 }),
  contact: varchar({ length: 11 }),
  instagram: varchar({ length: 200 }),
  tiktok: varchar({ length: 200 }),
  facebook: varchar({ length: 200 }),
  filePath: varchar({ length: 255 }),
  imagePaths: varchar({ length: 255 }).array().default([]).notNull(),
  rating: numeric({ mode: "number" }),
  // Only approved vendors are shown to customers. New rows start as pending; admin-created vendors are saved as approved.
  status: varchar({ length: 10 }).$type<VendorStatus>().default("pending").notNull(),
  reviewNote: varchar({ length: 500 }),
  reviewedAt: timestamp(),
}, (table) => [
  check("vendorsTable_status_check", sql`${table.status} in ('pending', 'approved', 'rejected')`),
  index("vendorsTable_status_idx").on(table.status),
]).enableRLS();

const packagesTable = pgTable("packagesTable", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp().defaultNow().notNull(),
  packageName: varchar({ length: 255 }).notNull(),
  price: numeric({ mode: "number" }).notNull(),
  details: varchar({ length: 1000 }),
  duration: numeric({ mode: "number" }),
  vendorId: integer().references(() => vendorsTable.id),
  filters: jsonb("filters").default({}),
  // Price lists, service details, anything (images or PDFs). Plus users only.
  attachments: jsonb("attachments").$type<StoredAttachment[]>().default([]).notNull(),
}, (table) => [
  check("packagesTable_attachments_check", sql`jsonb_typeof(${table.attachments}) = 'array'`),
]).enableRLS();

export { servicesTable, locationTable, vendorsTable, packagesTable };

// Links an admin sends to a vendor so they can submit their own listing. Only a SHA-256 hash of the token is stored.
export const vendorSubmissionLinks = pgTable("vendor_submission_links", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 255 }).notNull(),
  vendorEmail: varchar("vendor_email", { length: 255 }),
  createdBy: uuid("created_by").references(() => authUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  state: varchar("state", { length: 10 }).$type<SubmissionLinkState>().notNull().default("open"),
  vendorId: integer("vendor_id").references(() => vendorsTable.id, { onDelete: "set null" }),
  fixNote: varchar("fix_note", { length: 1000 }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
}, (table) => [
  check("vendor_submission_links_state_check", sql`${table.state} in ('open', 'submitted', 'reopened', 'closed', 'cancelled')`),
  index("vendor_submission_links_vendor_idx").on(table.vendorId),
  index("vendor_submission_links_created_idx").on(table.createdAt),
]).enableRLS();

// Fixed-window counters for unauthenticated requests (keyed by a hash of the IP address, or by link).
export const publicRequestLimits = pgTable("public_request_limits", {
  key: varchar("key", { length: 100 }).primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  requests: integer("requests").notNull().default(1),
}, (table) => [index("public_request_limits_window_idx").on(table.windowStart)]).enableRLS();

// Server-only tables. Their grants/revokes live in the baseline migration (migrations/).
// No browser policies are intentionally added.
export const manualSearchUsage = pgTable("manual_search_usage", {
  userId: uuid("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  day: date("day").notNull(),
  used: integer("used").notNull().default(0),
}, (table) => [
  primaryKey({ columns: [table.userId, table.day] }),
  check("manual_search_usage_used_check", sql`${table.used} >= 0`),
]).enableRLS();

export const manualSearchResults = pgTable("manual_search_results", {
  userId: uuid("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  searchId: uuid("search_id").notNull(),
  fingerprint: varchar("fingerprint", { length: 64 }).notNull(),
  matches: jsonb("matches").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.searchId] }),
  check("manual_search_results_matches_check", sql`jsonb_typeof(${table.matches}) = 'array'`),
]).enableRLS();

// Files uploaded straight to Storage but not yet saved into a listing. Saving a listing claims (deletes) its rows;
// rows older than a day are removed together with their files. `owner` is "admin:<user id>" or "link:<link id>".
export const pendingUploads = pgTable("pending_uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  owner: varchar("owner", { length: 80 }).notNull(),
  kind: varchar("kind", { length: 20 }).$type<UploadKind>().notNull(),
  path: varchar("path", { length: 255 }).notNull().unique(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("pending_uploads_owner_idx").on(table.owner),
  index("pending_uploads_created_idx").on(table.createdAt),
]).enableRLS();
