import {
  integer,
  pgTable,
  varchar,
  numeric,
  timestamp,
  jsonb,
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
  rating: numeric({ mode: "number" }),
});

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
});

export { servicesTable, locationTable, vendorsTable, packagesTable };
