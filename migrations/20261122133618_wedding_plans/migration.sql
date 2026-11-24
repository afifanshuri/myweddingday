CREATE TABLE "wedding_plans" (
	"user_id" uuid PRIMARY KEY,
	"plan" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wedding_plans_plan_check" CHECK (jsonb_typeof("plan") = 'object')
);
--> statement-breakpoint
ALTER TABLE "wedding_plans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "wedding_plans" ADD CONSTRAINT "wedding_plans_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
REVOKE ALL ON public.wedding_plans FROM PUBLIC, anon, authenticated;
