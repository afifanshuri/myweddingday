CREATE TABLE "shown_vendors" (
	"user_id" uuid,
	"vendor_id" integer,
	"shown_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shown_vendors_pkey" PRIMARY KEY("user_id","vendor_id")
);
--> statement-breakpoint
ALTER TABLE "shown_vendors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "shown_vendors_vendor_idx" ON "shown_vendors" ("vendor_id");--> statement-breakpoint
ALTER TABLE "shown_vendors" ADD CONSTRAINT "shown_vendors_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shown_vendors" ADD CONSTRAINT "shown_vendors_vendor_id_vendorsTable_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendorsTable"("id") ON DELETE CASCADE;--> statement-breakpoint
-- Server-only table: no access for browser roles (the app reads it through DATABASE_URL).
REVOKE ALL ON public.shown_vendors FROM PUBLIC, anon, authenticated;--> statement-breakpoint
-- Backfill, so nobody's shortlist or budget changes: vendors in unexpired searches, unlocked vendors, and the vendors
-- already in each saved plan's shortlist and budget (only vendors that still exist).
INSERT INTO public.shown_vendors (user_id, vendor_id)
SELECT DISTINCT ids.user_id, ids.vendor_id FROM (
  SELECT s.user_id, (m->>'vendorId')::integer AS vendor_id
    FROM public.manual_search_snapshots s, jsonb_array_elements(s.matches) m
  UNION SELECT u.user_id, u.vendor_id FROM public.unlocked_vendors u
  UNION SELECT p.user_id, (e->>'vendorId')::integer FROM public.wedding_plans p, jsonb_array_elements(coalesce(p.plan->'shortlist', '[]'::jsonb)) e
    WHERE jsonb_typeof(e->'vendorId') = 'number'
  UNION SELECT p.user_id, (e->>'vendorId')::integer FROM public.wedding_plans p, jsonb_array_elements(coalesce(p.plan->'selectedPackages', '[]'::jsonb)) e
    WHERE jsonb_typeof(e->'vendorId') = 'number'
) ids
JOIN public."vendorsTable" v ON v.id = ids.vendor_id
ON CONFLICT DO NOTHING;
