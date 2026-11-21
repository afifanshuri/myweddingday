-- Aligns the existing production database with the baseline. Idempotent: on a
-- database built from the baseline every statement below is a no-op.

-- 1. Constraint names. These two foreign keys were created by the hand-written
--    Supabase migration (20261025071526) and use Postgres default names. Drizzle's
--    snapshot expects its own naming convention, so future migrations that touch
--    these constraints would fail on production without this rename.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'manual_search_usage_user_id_fkey'
             AND conrelid = 'public.manual_search_usage'::regclass) THEN
    ALTER TABLE public.manual_search_usage
      RENAME CONSTRAINT manual_search_usage_user_id_fkey TO manual_search_usage_user_id_users_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'manual_search_results_user_id_fkey'
             AND conrelid = 'public.manual_search_results'::regclass) THEN
    ALTER TABLE public.manual_search_results
      RENAME CONSTRAINT manual_search_results_user_id_fkey TO manual_search_results_user_id_users_id_fkey;
  END IF;
END $$;--> statement-breakpoint

-- 2. Browser roles hold TRUNCATE, TRIGGER and REFERENCES on the catalogue
--    tables. The app reads them only through the server (Drizzle), so the
--    browser roles need no privileges here.
REVOKE ALL PRIVILEGES ON TABLE public."locationTable", public."servicesTable" FROM anon, authenticated, PUBLIC;
