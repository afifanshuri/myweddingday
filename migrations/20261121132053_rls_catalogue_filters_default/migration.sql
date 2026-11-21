ALTER TABLE "locationTable" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "servicesTable" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "packagesTable" ALTER COLUMN "filters" SET DEFAULT '{}';--> statement-breakpoint
-- Rows created with the old default hold the JSON string "{}". Key lookups return null either way, so matching is unchanged.
UPDATE "packagesTable" SET "filters" = '{}'::jsonb WHERE "filters" = '"{}"'::jsonb;
