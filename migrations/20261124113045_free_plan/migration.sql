CREATE TABLE "free_searches" (
	"user_id" uuid PRIMARY KEY,
	"search_id" uuid NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "free_searches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "unlocked_vendors" (
	"user_id" uuid,
	"vendor_id" integer,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unlocked_vendors_pkey" PRIMARY KEY("user_id","vendor_id")
);
--> statement-breakpoint
ALTER TABLE "unlocked_vendors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "vendorsTable_serviceId_idx" ON "vendorsTable" ("serviceId");--> statement-breakpoint
ALTER TABLE "free_searches" ADD CONSTRAINT "free_searches_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "unlocked_vendors" ADD CONSTRAINT "unlocked_vendors_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "unlocked_vendors" ADD CONSTRAINT "unlocked_vendors_vendor_id_vendorsTable_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendorsTable"("id") ON DELETE CASCADE;--> statement-breakpoint
-- Server-only tables: no access for browser roles (the app reads them through DATABASE_URL).
REVOKE ALL ON public.free_searches, public.unlocked_vendors FROM PUBLIC, anon, authenticated;
