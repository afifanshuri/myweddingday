CREATE TABLE "public_request_limits" (
	"key" varchar(100) PRIMARY KEY,
	"window_start" timestamp with time zone NOT NULL,
	"requests" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "public_request_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vendor_submission_links" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "vendor_submission_links_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"token_hash" varchar(64) NOT NULL UNIQUE,
	"label" varchar(255) NOT NULL,
	"vendor_email" varchar(255),
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"state" varchar(10) DEFAULT 'open' NOT NULL,
	"vendor_id" integer,
	"fix_note" varchar(1000),
	"submitted_at" timestamp with time zone,
	CONSTRAINT "vendor_submission_links_state_check" CHECK ("state" in ('open', 'submitted', 'reopened', 'closed', 'cancelled'))
);
--> statement-breakpoint
ALTER TABLE "vendor_submission_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "public_request_limits_window_idx" ON "public_request_limits" ("window_start");--> statement-breakpoint
CREATE INDEX "vendor_submission_links_vendor_idx" ON "vendor_submission_links" ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_submission_links_created_idx" ON "vendor_submission_links" ("created_at");--> statement-breakpoint
ALTER TABLE "vendor_submission_links" ADD CONSTRAINT "vendor_submission_links_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vendor_submission_links" ADD CONSTRAINT "vendor_submission_links_vendor_id_vendorsTable_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendorsTable"("id") ON DELETE SET NULL;--> statement-breakpoint
-- Server-only tables: the app connects as the owner; browser roles get nothing (RLS on, no policies).
REVOKE ALL ON public.vendor_submission_links, public.public_request_limits FROM PUBLIC, anon, authenticated;--> statement-breakpoint
SELECT cron.schedule('myweddingday-public-limits-cleanup', '0 * * * *', $cron$
  delete from public.public_request_limits where window_start < now() - interval '1 day';
  delete from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'myweddingday-public-limits-cleanup') and end_time < now() - interval '7 days';
$cron$);
