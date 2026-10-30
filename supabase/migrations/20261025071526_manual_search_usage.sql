-- Run after Drizzle push creates the tables, constraints, and RLS settings.
-- This is permissions-only SQL; it does not create tables.
revoke all on public.manual_search_usage, public.manual_search_results from public, anon, authenticated;
