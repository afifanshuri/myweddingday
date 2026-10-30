import { sql } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import {
  check,
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

const servicesTable = pgTable("servicesTable", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp().defaultNow().notNull(),
  serviceName: varchar({ length: 255 }).notNull(),
});

const locationTable = pgTable("locationTable", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp().defaultNow().notNull(),
  locationName: varchar({ length: 255 }).notNull(),
});

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
}).enableRLS();

const packagesTable = pgTable("packagesTable", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp().defaultNow().notNull(),
  packageName: varchar({ length: 255 }).notNull(),
  price: numeric({ mode: "number" }).notNull(),
  filePath: varchar({ length: 255 }),
  details: varchar({ length: 1000 }),
  duration: numeric({ mode: "number" }),
  vendorId: integer().references(() => vendorsTable.id),
  filters: jsonb("filters").default("{}"),
}).enableRLS();

export { servicesTable, locationTable, vendorsTable, packagesTable };

// Server-only tables. Apply the permissions migration after Drizzle push.
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
