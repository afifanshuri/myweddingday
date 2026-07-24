import {
  integer,
  pgTable,
  varchar,
  vector,
  bigint,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { number } from "motion/react";

export const timestamps = {
  updated_at: timestamp(),
  created_at: timestamp().defaultNow().notNull(),
  deleted_at: timestamp(),
};

const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp().defaultNow().notNull(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

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
  locationId: integer()
    .notNull()
    .references(() => locationTable.id),
  detail: varchar({ length: 500 }),
  contact: varchar({ length: 11 }),
  filePath: varchar({ length: 255 }),
  rating: numeric({ mode: "number" }),
});

const packagesTable = pgTable("packagesTable", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp().defaultNow().notNull(),
  packageName: varchar({ length: 255 }).notNull(),
  price: numeric({ mode: "number" }).notNull(),
  filePath: varchar({ length: 255 }),
  details: varchar({ length: 1000 }),
  vendorId: integer().references(() => vendorsTable.id),
  embedding: vector("embedding", { dimensions: 3072 }),
});

export {
  usersTable,
  servicesTable,
  locationTable,
  vendorsTable,
  packagesTable,
};
