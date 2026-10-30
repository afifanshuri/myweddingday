-- Vendor identity and packages are served only by authorized server endpoints.
-- Public match previews are explicitly projected by /api/match/vendors.
REVOKE ALL PRIVILEGES ON TABLE public."vendorsTable", public."packagesTable" FROM anon, authenticated, PUBLIC;

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
END $$;
