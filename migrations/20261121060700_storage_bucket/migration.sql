-- Private Supabase Storage bucket for vendor and package images
-- (see ASSET_PATH in src/config/serviceCriteria.ts).
-- Uploads and signed URLs go through the server's service-role key, so no
-- storage.objects policies are needed. The vendorImages/ and packageImages/
-- folders are created automatically on first upload.
-- Matches production as of 2026-11-21; a no-op where the bucket already exists.
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', false)
ON CONFLICT (id) DO NOTHING;
