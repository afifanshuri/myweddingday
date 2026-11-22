CREATE TABLE "pending_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"owner" varchar(80) NOT NULL,
	"kind" varchar(20) NOT NULL,
	"path" varchar(255) NOT NULL UNIQUE,
	"file_name" varchar(255) NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pending_uploads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "packagesTable" ADD COLUMN "attachments" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
CREATE INDEX "pending_uploads_owner_idx" ON "pending_uploads" ("owner");--> statement-breakpoint
CREATE INDEX "pending_uploads_created_idx" ON "pending_uploads" ("created_at");--> statement-breakpoint
ALTER TABLE "packagesTable" ADD CONSTRAINT "packagesTable_attachments_check" CHECK (jsonb_typeof("attachments") = 'array');--> statement-breakpoint
-- Each package's old single image becomes its first attachment (the file stays where it is).
UPDATE "packagesTable" SET "attachments" = jsonb_build_array(jsonb_build_object(
  'path', "filePath", 'name', 'Package image', 'kind', 'image', 'size', null))
WHERE "filePath" IS NOT NULL AND "attachments" = '[]'::jsonb;--> statement-breakpoint
-- Server-only table: browser roles get nothing (RLS on, no policies).
REVOKE ALL ON public.pending_uploads FROM PUBLIC, anon, authenticated;--> statement-breakpoint
-- Storage enforces these on direct uploads too; the server also checks each file's real type and size before saving it.
UPDATE storage.buckets SET file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
WHERE id = 'assets';
