CREATE TABLE "locationTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "locationTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"locationName" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manual_search_results" (
	"user_id" uuid,
	"search_id" uuid,
	"fingerprint" varchar(64) NOT NULL,
	"matches" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "manual_search_results_pkey" PRIMARY KEY("user_id","search_id"),
	CONSTRAINT "manual_search_results_matches_check" CHECK (jsonb_typeof("matches") = 'array')
);
--> statement-breakpoint
ALTER TABLE "manual_search_results" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "manual_search_snapshots" (
	"user_id" uuid,
	"search_id" uuid,
	"fingerprint" varchar(64) NOT NULL,
	"matches" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "manual_search_snapshots_pkey" PRIMARY KEY("user_id","search_id"),
	CONSTRAINT "manual_search_snapshots_matches_check" CHECK (jsonb_typeof("matches") = 'array')
);
--> statement-breakpoint
ALTER TABLE "manual_search_snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "manual_search_usage" (
	"user_id" uuid,
	"day" date,
	"used" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "manual_search_usage_pkey" PRIMARY KEY("user_id","day"),
	CONSTRAINT "manual_search_usage_used_check" CHECK ("used" >= 0)
);
--> statement-breakpoint
ALTER TABLE "manual_search_usage" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "packagesTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "packagesTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"packageName" varchar(255) NOT NULL,
	"price" numeric NOT NULL,
	"filePath" varchar(255),
	"details" varchar(1000),
	"duration" numeric,
	"vendorId" integer,
	"filters" jsonb DEFAULT '"{}"'
);
--> statement-breakpoint
ALTER TABLE "packagesTable" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "search_request_limits" (
	"user_id" uuid,
	"action" varchar(16),
	"window_start" timestamp with time zone NOT NULL,
	"requests" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "search_request_limits_pkey" PRIMARY KEY("user_id","action")
);
--> statement-breakpoint
ALTER TABLE "search_request_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "servicesTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "servicesTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"serviceName" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendorsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "vendorsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"vendorName" varchar(255) NOT NULL,
	"serviceId" integer NOT NULL,
	"locationId" integer[] NOT NULL,
	"detail" varchar(500),
	"contact" varchar(11),
	"instagram" varchar(200),
	"tiktok" varchar(200),
	"facebook" varchar(200),
	"filePath" varchar(255),
	"imagePaths" varchar(255)[] DEFAULT '{}'::varchar(255)[] NOT NULL,
	"rating" numeric
);
--> statement-breakpoint
ALTER TABLE "vendorsTable" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "manual_search_snapshots_expiry_idx" ON "manual_search_snapshots" ("expires_at");--> statement-breakpoint
ALTER TABLE "manual_search_results" ADD CONSTRAINT "manual_search_results_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "manual_search_snapshots" ADD CONSTRAINT "manual_search_snapshots_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "manual_search_usage" ADD CONSTRAINT "manual_search_usage_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "packagesTable" ADD CONSTRAINT "packagesTable_vendorId_vendorsTable_id_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorsTable"("id");--> statement-breakpoint
ALTER TABLE "search_request_limits" ADD CONSTRAINT "search_request_limits_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vendorsTable" ADD CONSTRAINT "vendorsTable_serviceId_servicesTable_id_fkey" FOREIGN KEY ("serviceId") REFERENCES "servicesTable"("id");--> statement-breakpoint
-- ---------------------------------------------------------------------------
-- Hand-written section (not tracked by snapshot.json).
-- Consolidated from supabase/migrations/20261023151836_protect_vendor_details.sql,
-- supabase/migrations/20261025071526_manual_search_usage.sql and
-- scripts/search-maintenance.sql. Production already has all of this applied.
-- ---------------------------------------------------------------------------

-- Vendor identity and packages are served only by authorized server endpoints.
REVOKE ALL PRIVILEGES ON TABLE public."vendorsTable", public."packagesTable" FROM anon, authenticated, PUBLIC;--> statement-breakpoint
-- Table revocation does not remove independently granted column privileges.
DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT table_name, string_agg(quote_ident(column_name), ', ') AS columns
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name IN ('vendorsTable', 'packagesTable')
    GROUP BY table_name
  LOOP
    EXECUTE format('REVOKE SELECT (%1$s), INSERT (%1$s), UPDATE (%1$s), REFERENCES (%1$s) ON TABLE public.%2$I FROM anon, authenticated, PUBLIC', target.columns, target.table_name);
  END LOOP;
END $$;--> statement-breakpoint
-- Server-only tables: no browser roles, no RLS policies.
REVOKE ALL ON public.manual_search_usage, public.manual_search_results, public.manual_search_snapshots, public.search_request_limits FROM PUBLIC, anon, authenticated;--> statement-breakpoint
-- Scheduled cleanup of expired search snapshots and stale throttle rows.
CREATE EXTENSION IF NOT EXISTS pg_cron;--> statement-breakpoint
SELECT cron.schedule('myweddingday-search-cleanup', '*/15 * * * *', $cron$
  delete from public.manual_search_snapshots where expires_at <= now();
  delete from public.search_request_limits where window_start < now() - interval '1 day';
  delete from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'myweddingday-search-cleanup') and end_time < now() - interval '7 days';
$cron$);
