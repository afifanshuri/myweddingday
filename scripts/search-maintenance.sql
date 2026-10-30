-- Apply after Drizzle push. No table creation belongs in this script.
revoke all on public.manual_search_snapshots, public.search_request_limits from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('myweddingday-search-cleanup', '*/15 * * * *', $$
  delete from public.manual_search_snapshots where expires_at <= now();
  delete from public.search_request_limits where window_start < now() - interval '1 day';
  delete from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'myweddingday-search-cleanup') and end_time < now() - interval '7 days';
$$);
