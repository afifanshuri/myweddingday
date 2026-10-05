# Admin submissions

Vendor creation uses one multipart `POST /api/vendors` request containing a JSON
`payload` with `vendor` and `packages`, plus optional `file_0`, `file_1`, etc.
The old separate `POST /api/packages` endpoint no longer writes records.

The server verifies the Supabase session with `auth.getUser()` and requires
`user.app_metadata.role` to equal `admin`. Assign this metadata through trusted
Supabase admin tooling. Client-side roles and editable `user_metadata` are ignored.
The existing login page uses Supabase email/password authentication. Configure
Supabase email delivery and confirmation settings for registration. Anonymous
requests return 401; non-admin users return 403. Signed-in admins are routed to
`/admin`; other accounts are routed to `/weddingplan`.

Required configuration:

- `DATABASE_URL`: database connection used by Drizzle.
- `NEXT_PUBLIC_SUPABASE_URL`: project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: browser and cookie-session client key.
- `NEXT_PRIVATE_SUPABASE_SERVICE_KEY`: server-only elevated storage key.
- Storage bucket `assets`, with package images stored under `packageImages/`.

Each image must be JPEG, PNG or WebP, have a matching file signature, and be at most
5 MB. The complete request is capped at 25 MB; submissions contain 1–20 packages.
Vendor/package text limits match the database schema. Ratings cannot be submitted.

Images are uploaded before a database transaction creates the vendor and all
packages. Upload or database failures trigger deletion of uploaded files. Storage
and Postgres cannot share a transaction: process crashes or storage cleanup failures
can still leave orphaned images. Cleanup failures are reported in server logs.
The UI prevents concurrent submissions and stays open on failure. There is no durable
idempotency guarantee for retries after an ambiguous network failure.

Run regression checks with `npm run test:submissions` and `npx tsc --noEmit`.
The tests use fake storage/save dependencies and never modify the live database.
