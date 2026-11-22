# Database migrations

This folder is the single source of truth for the database structure. `drizzle.config.ts` points here (`out: "./migrations"`).

| Migration | What it does |
| --- | --- |
| `20261121054125_baseline` | All tables, keys, checks, indexes and RLS flags from `src/db/schema.ts`, plus the hand-written grants/revokes and the pg_cron cleanup job |
| `20261121054151_align_production` | Renames two foreign keys to Drizzle's naming, revokes leftover browser-role privileges on `locationTable`/`servicesTable`. A no-op on databases built from the baseline |
| `20261121060700_storage_bucket` | Creates the private `assets` Storage bucket used for vendor/package images |
| `20261121132053_rls_catalogue_filters_default` | Enables RLS on `locationTable`/`servicesTable`, sets `packagesTable.filters` to default `{}` and converts rows that held the string `"{}"` |
| `20261122082808_vendor_listing_status` | Adds `vendorsTable.status` (`pending`/`approved`/`rejected`, checked and indexed), `reviewNote` and `reviewedAt`. Existing vendors become `approved`; new rows default to `pending` |

Production was switched to these migrations on 2026-11-21: the baseline was marked as applied (it was already there, built with `drizzle-kit push` and SQL scripts), and the other three were applied with `npx drizzle-kit migrate`. All four are recorded in `drizzle.__drizzle_migrations`.

## New environment (fresh Supabase project or fork)

Run `npx drizzle-kit migrate` and nothing else. It creates the tables, permissions, cleanup job and Storage bucket. The project needs the Supabase `auth` and `storage` schemas, the `anon`/`authenticated` roles and the pg_cron extension, all of which Supabase provides. The bucket starts empty, and no catalogue data (services, locations) is seeded yet.

## Making changes from now on

1. Edit `src/db/schema.ts`.
2. `npx drizzle-kit generate --name <short_description>` creates a new folder here.
3. Review `migration.sql`, commit it, then run `npx drizzle-kit migrate`.

For SQL that Drizzle doesn't model (grants, policies, functions, cron), use `npx drizzle-kit generate --custom --name <description>` and write the SQL yourself.

**Don't use `drizzle-kit push` any more.** It changes the database without writing a migration, which is how the old `drizzle/` folder went out of date.

## Notes

- RLS is enabled on every public table with no policies, so the `anon`/`authenticated` browser roles can't read or write them. The app connects as the table owner, which RLS doesn't restrict. Supabase's advisor lists these as "RLS enabled, no policy" (informational); that is intended.
- `.gitignore` ignores `*.md`; this README is kept by a `!migrations/README.md` exception.
