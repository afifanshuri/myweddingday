-- Existing vendors are already live, so they are filled in as approved. New rows default to pending.
ALTER TABLE "vendorsTable" ADD COLUMN "status" varchar(10) DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendorsTable" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "vendorsTable" ADD COLUMN "reviewNote" varchar(500);--> statement-breakpoint
ALTER TABLE "vendorsTable" ADD COLUMN "reviewedAt" timestamp;--> statement-breakpoint
CREATE INDEX "vendorsTable_status_idx" ON "vendorsTable" ("status");--> statement-breakpoint
ALTER TABLE "vendorsTable" ADD CONSTRAINT "vendorsTable_status_check" CHECK ("status" in ('pending', 'approved', 'rejected'));