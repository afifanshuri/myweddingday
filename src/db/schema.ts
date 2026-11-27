import { sql } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import type { VendorStatus } from "@/config/vendorStatus";
import type { SubmissionLinkState } from "@/config/submissionLinks";
import type { StoredAttachment, UploadKind } from "@/config/uploads";
import type { SavedPlan } from "@/config/weddingPlan";
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
  primaryKey,
} from "drizzle-orm/pg-core";

export const timestamps = {
  updated_at: timestamp(),
  created_at: timestamp().defaultNow().notNull(),
  deleted_at: timestamp(),
};

// Saved searches: ranked vendor and package IDs only (details are read fresh on each request), kept 24 hours.
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
  index("vendorsTable_serviceId_idx").on(table.serviceId),
]).enableRLS();

const packagesTable = pgTable("packagesTable", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp().defaultNow().notNull(),
  packageName: varchar({ length: 255 }).notNull(),
  price: numeric({ mode: "number" }).notNull(),
  details: varchar({ length: 1000 }),
  duration: numeric({ mode: "number" }),
  vendorId: integer().notNull().references(() => vendorsTable.id, { onDelete: "cascade" }),
  filters: jsonb("filters").default({}),
  // Price lists, service details, anything (images or PDFs). Plus users only.
  attachments: jsonb("attachments").$type<StoredAttachment[]>().default([]).notNull(),
}, (table) => [
  check("packagesTable_attachments_check", sql`jsonb_typeof(${table.attachments}) = 'array'`),
  index("packagesTable_vendorId_idx").on(table.vendorId),
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

// Server-only tables: browser roles have no access (grants are revoked in migrations/), and no
// browser policies are intentionally added.

// A free account's one search: at most one row per user (the primary key enforces it).
export const freeSearches = pgTable("free_searches", {
  userId: uuid("user_id").primaryKey().references(() => authUsers.id, { onDelete: "cascade" }),
  searchId: uuid("search_id").notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

// Vendors a free account may see in full: one per service from its free search. Kept permanently, so its
// shortlist and budget keep working after the search expires. Removed with the user or the vendor.
export const unlockedVendors = pgTable("unlocked_vendors", {
  userId: uuid("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  vendorId: integer("vendor_id").notNull().references(() => vendorsTable.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.vendorId] }),
  index("unlocked_vendors_vendor_idx").on(table.vendorId),
]).enableRLS();

// Vendors an account has been shown in its search results (in full or as a locked preview), kept permanently.
// The shortlist and budget only return vendors listed here (admins excepted), so made-up vendor IDs can't be used
// to copy the catalogue. Removed with the user or the vendor.
export const shownVendors = pgTable("shown_vendors", {
  userId: uuid("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  vendorId: integer("vendor_id").notNull().references(() => vendorsTable.id, { onDelete: "cascade" }),
  shownAt: timestamp("shown_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.vendorId] }),
  index("shown_vendors_vendor_idx").on(table.vendorId),
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

// One saved wedding plan per account (wedding details, preferences, selected packages, the recent search).
// Only the server reads and writes it; `revision` stops an older copy from overwriting a newer one.
export const weddingPlans = pgTable("wedding_plans", {
  userId: uuid("user_id").primaryKey().references(() => authUsers.id, { onDelete: "cascade" }),
  plan: jsonb("plan").$type<SavedPlan>().notNull(),
  revision: integer("revision").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [check("wedding_plans_plan_check", sql`jsonb_typeof(${table.plan}) = 'object'`)]).enableRLS();
