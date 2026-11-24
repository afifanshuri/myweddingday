// Password-reset and email-link flow against a local dev server. Creates and deletes one temporary account.
// Usage: node tests/auth-recovery-http.mjs http://localhost:3000
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const base = process.argv[2] ?? "http://localhost:3000";
assert.ok(new URL(base).hostname === "localhost", "Only run against the local app");
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PRIVATE_SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });

const jar = new Map();
const cookie = () => [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
async function get(path, { withCookies = true } = {}) {
  const response = await fetch(`${base}${path}`, { redirect: "manual", headers: withCookies && jar.size ? { cookie: cookie() } : {} });
  for (const header of response.headers.getSetCookie()) {
    const [pair] = header.split(";"); const at = pair.indexOf("=");
    const name = pair.slice(0, at); const value = pair.slice(at + 1);
    if (!value || /max-age=0(?:;|$)/i.test(header)) jar.delete(name); else jar.set(name, value);
  }
  const html = await response.text();
  // Pages redirect inside Suspense, so the redirect may arrive in the streamed HTML instead of a Location header.
  const redirectsTo = (target) => response.headers.get("location") === target || html.includes(`url=${target}`) || html.includes(`;${target};`);
  return { status: response.status, html, redirectsTo, location: response.headers.get("location") ? new URL(response.headers.get("location"), base).pathname + new URL(response.headers.get("location"), base).search : null };
}

const email = `recovery-${randomUUID()}@example.test`;
const oldPassword = `Old-${randomUUID()}-aA1!`;
const newPassword = `New-${randomUUID()}-aA1!`;
const anon = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const { data: created, error } = await admin.auth.admin.createUser({ email, password: oldPassword, email_confirm: true,
  user_metadata: { firstTimeLogin: false }, app_metadata: { role: "user" } });
if (error) throw new Error(`Test account creation failed: ${error.message}`);
try {
  // Bad and missing links fall back to login with a fixed notice.
  for (const path of ["/auth/confirm", "/auth/confirm?code=not-a-code", "/auth/confirm?token_hash=bogus&type=recovery", "/auth/confirm?token_hash=x&type=evil"]) {
    const result = await get(path, { withCookies: false });
    assert.equal(result.status, 307, path);
    assert.equal(result.location, "/login?notice=link-invalid", path);
  }
  assert.equal((await get("/forgot-password", { withCookies: false })).status, 200);
  assert.ok((await get("/reset-password", { withCookies: false })).redirectsTo("/login"), "reset-password must send guests to login");
  console.log("Guest: invalid links rejected, forgot-password public, reset-password needs a session");

  // A real recovery link signs the user in and lands on the new-password page.
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "recovery", email });
  if (linkError) throw new Error(`Link generation failed: ${linkError.message}`);
  const confirmed = await get(`/auth/confirm?token_hash=${link.properties.hashed_token}&type=recovery`);
  assert.equal(confirmed.location, "/reset-password");
  assert.ok(jar.size > 0, "Recovery link must set a session cookie");
  const resetPage = await get("/reset-password");
  assert.ok(resetPage.status === 200 && !resetPage.redirectsTo("/login"), "reset-password must render for the recovery session");
  assert.ok(jar.has("recovery_session"), "Recovery link must mark the session");
  assert.ok(resetPage.html.includes("Choose a new password"), "A reset-link session gets the reset form (signs out after saving)");
  assert.ok((await get("/forgot-password")).redirectsTo("/dashboard"), "Signed-in users are sent away from forgot-password");
  // The same link can't be used twice.
  const reused = await get(`/auth/confirm?token_hash=${link.properties.hashed_token}&type=recovery`, { withCookies: false });
  assert.equal(reused.location, "/login?notice=link-invalid");
  console.log("Recovery: link signs in once, reaches reset-password, cannot be reused");

  // Same calls as ResetPasswordForm: update the password with the recovery session, then sign out everywhere.
  const sessionClient = () => createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false },
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value: decodeURIComponent(value) })),
      setAll: (cookies) => cookies.forEach(({ name, value }) => value ? jar.set(name, encodeURIComponent(value)) : jar.delete(name)),
    },
  });
  const session = sessionClient();
  const same = await session.auth.updateUser({ password: oldPassword });
  assert.equal(same.error?.code, "same_password", "Reusing the current password must be rejected with same_password");
  const updated = await session.auth.updateUser({ password: newPassword });
  assert.equal(updated.error, null, `Password update failed: ${updated.error?.message}`);
  const other = await anon().auth.signInWithPassword({ email, password: newPassword });
  assert.equal(other.error, null, "New password must sign in");
  assert.ok((await anon().auth.signInWithPassword({ email, password: oldPassword })).error, "Old password must stop working");
  const recoveryRefresh = (await session.auth.getSession()).data.session.refresh_token;
  assert.equal((await session.auth.signOut({ scope: "global" })).error, null);
  assert.ok(![...jar.keys()].some((name) => name.startsWith("sb-")), "Sign-out must clear the session cookies");
  for (const refresh_token of [recoveryRefresh, other.data.session.refresh_token])
    assert.ok((await anon().auth.refreshSession({ refresh_token })).error, "Every session must be ended after the reset");
  assert.ok((await get("/reset-password")).redirectsTo("/login"), "After the reset the user is signed out");
  assert.equal((await get("/login?notice=password-updated")).status, 200);
  console.log("New password: saved, works for login, old password rejected; all sessions ended, back to sign-in");

  // A normal password sign-in (with the old recovery cookie still around) changes the password and stays signed in.
  const signedIn = sessionClient();
  assert.equal((await signedIn.auth.signInWithPassword({ email, password: newPassword })).error, null);
  const changePage = await get("/reset-password");
  assert.ok(changePage.status === 200 && changePage.html.includes("Change your password"), "A normal session gets the change form (stays signed in)");
  const changedPassword = `Changed-${randomUUID()}-aA1!`;
  assert.equal((await signedIn.auth.updateUser({ password: changedPassword })).error, null);
  assert.ok((await get("/forgot-password")).redirectsTo("/dashboard"), "Still signed in after changing the password");
  assert.equal((await anon().auth.signInWithPassword({ email, password: changedPassword })).error, null);
  console.log("Signed-in change: change form shown, password updated, user stays signed in");

  // A non-recovery link (magic link) goes to the account's default destination instead.
  jar.clear();
  const { data: magic } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  assert.equal((await get(`/auth/confirm?token_hash=${magic.properties.hashed_token}&type=magiclink`)).location, "/dashboard");
  console.log("Email link: signs in and routes to the default destination");
} finally {
  await admin.auth.admin.deleteUser(created.user.id);
  console.log("Cleaned up the temporary account");
}
