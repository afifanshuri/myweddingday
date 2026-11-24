import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const base = process.argv[2] ?? "http://localhost:3000";
assert.ok(new URL(base).hostname === "localhost", "Only run against the local app");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(url).hostname, "mbrdrexnhxihqlyqukmx.supabase.co");
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin = createClient(url, process.env.NEXT_PRIVATE_SUPABASE_SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const created = [];
const password = `Test-${randomUUID()}-aA1!`;
const run = randomUUID();
async function account(role) {
  const email = `phase1-${run}-${role}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true,
    app_metadata: { role, phase1_test: run, custom_flag: "preserve" } });
  if (error) throw new Error(`Test account creation failed: ${error.message}`);
  created.push(data.user.id);
  const jar = new Map();
  const auth = createServerClient(url, key, { auth: { autoRefreshToken: false }, cookies: {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: (cookies) => cookies.forEach(({ name, value }) => jar.set(name, value)),
  } });
  const login = await auth.auth.signInWithPassword({ email, password });
  if (login.error) throw new Error(`Test sign-in failed: ${login.error.message}`);
  return { id: data.user.id, auth, lastCookieWrites: 0,
    cookie: () => [...jar].map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join("; "),
    applyCookies(response) {
      const cookies = response.headers.getSetCookie();
      this.lastCookieWrites = cookies.length;
      for (const cookie of cookies) {
        const pair = cookie.split(";")[0]; const equal = pair.indexOf("=");
        const name = pair.slice(0, equal); const value = decodeURIComponent(pair.slice(equal + 1));
        if (!value || /max-age=0(?:;|$)/i.test(cookie)) jar.delete(name); else jar.set(name, value);
      }
    },
    async expireSession() {
      const { data, error } = await auth.auth.getSession();
      if (error || !data.session) throw new Error("Missing test session");
      const value = "base64-" + Buffer.from(JSON.stringify({ ...data.session, expires_at: Math.floor(Date.now() / 1000) - 10 })).toString("base64url");
      const name = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
      jar.clear();
      if (value.length <= 3000) jar.set(name, value);
      else for (let i = 0; i < value.length; i += 3000) jar.set(`${name}.${i / 3000}`, value.slice(i, i + 3000));
    },
  };
}
const searchIds = new Map();
async function request(path, account, method = "GET", body, expected = 200) {
  const searchKey = `${account?.id}:${JSON.stringify(body)}`;
  if (!searchIds.has(searchKey)) searchIds.set(searchKey, randomUUID());
  const response = await fetch(`${base}${path}`, { method, redirect: "manual", headers: {
    ...(account ? { cookie: account.cookie() } : {}), ...(body !== undefined ? { "content-type": "application/json" } : {}), origin: base,
    ...(path === "/api/match/vendors" ? { "Idempotency-Key": searchIds.get(searchKey) } : {}),
  }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  account?.applyCookies(response);
  assert.equal(response.status, expected, `${method} ${path}: expected ${expected}, got ${response.status}`);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  const data = await response.json();
  return path === "/api/match/vendors" && response.ok ? [...data.topMatches, ...data.matches] : data;
}
const preferences = [{ serviceId: 3, budget: 1000000, location: [1], criteria: {} }];
// Paid-only endpoint used to check access grants, expiry and revocation.
const paidPath = "/api/account/selections";
// Bulk vendor reads were removed; they must stay gone for every account type.
const removedPaths = [["/api/vendors?serviceIds=1,2,3,4,5,6", 405], ["/api/vendors/1", 404], ["/api/services/3", 404], ["/api/packages", 404], ["/api/vendors/search?q=de", 404]];
async function removed(account) {
  for (const [path, status] of removedPaths) {
    const response = await fetch(`${base}${path}`, { redirect: "manual", headers: account ? { cookie: account.cookie() } : {} });
    await response.arrayBuffer();
    assert.equal(response.status, status, `${path} must be removed (expected ${status}, got ${response.status})`);
  }
}
function locked(matches) {
  assert.ok(matches.length > 0, "Fixture must return vendors");
  for (const match of matches) {
    assert.equal(match.identityLocked, true);
    assert.deepEqual(Object.keys(match).sort(), ["cheapestPrice", "identityLocked", "vendor"]);
    assert.deepEqual(Object.keys(match.vendor).sort(), ["id", "imageUrls", "rating", "serviceId"]);
    assert.equal("packages" in match, false);
  }
}
async function pageRedirect(path, account, destination) {
  const response = await fetch(`${base}${path}`, { redirect: "manual", headers: account ? { cookie: account.cookie() } : {} });
  const html = await response.text();
  account?.applyCookies(response);
  assert.ok(response.headers.get("location") === destination || html.includes(`url=${destination}`) || html.includes(`;${destination};`), `${path} must redirect to ${destination}`);
}
try {
  await removed(null);
  await request("/api/account/selections", null, "POST", [], 401);
  await request("/api/admin/users", null, "GET", undefined, 401);
  await request("/api/match/vendors", null, "POST", preferences, 401);
  await pageRedirect("/admin/users", null, "/login");
  await pageRedirect("/match/1", null, "/login");
  await pageRedirect("/weddingplan", null, "/login");
  await pageRedirect("/weddingplan/1", null, "/login");
  await pageRedirect("/dashboard", null, "/login");
  await pageRedirect("/payment?returnTo=%2Fmatch", null, "/login");
  const fakeToken = [Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"),
    Buffer.from(JSON.stringify({ sub: "00000000-0000-0000-0000-000000000000", exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated", app_metadata: { role: "admin" } })).toString("base64url"), "forged-signature"].join(".");
  const fakeSession = "base64-" + Buffer.from(JSON.stringify({ access_token: fakeToken, refresh_token: "forged-refresh", expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: "bearer", user: { app_metadata: { role: "admin" } } })).toString("base64url");
  const forgedCookie = { cookie: () => `sb-${new URL(url).hostname.split(".")[0]}-auth-token=${fakeSession}`, applyCookies() {} };
  await request(paidPath, forgedCookie, "POST", [1], 401);
  console.log("Guest: previews only; detail and admin requests rejected");
  const actor = await account("admin");
  const target = await account("user");
  const original = (await admin.auth.admin.getUserById(target.id)).data.user.app_metadata;
  await request("/api/account/login-destination", null, "POST", undefined, 401);
  assert.equal((await request("/api/account/login-destination", target, "POST")).destination, "/dashboard");
  const before = (await admin.auth.admin.getUserById(target.id)).data.user;
  assert.ifError((await admin.auth.admin.updateUserById(target.id, { user_metadata: { firstTimeLogin: true, language: "bm", custom_preference: "preserve" } })).error);
  await pageRedirect("/", target, "/weddingplan");
  await pageRedirect("/login?next=%2Fdashboard", target, "/weddingplan");
  assert.equal((await admin.auth.admin.getUserById(target.id)).data.user.user_metadata.firstTimeLogin, true, "GET must not consume the flag");
  const blocked = await fetch(`${base}/api/account/login-destination`, { method: "POST", headers: { cookie: target.cookie(), origin: "https://evil.test" } });
  assert.equal(blocked.status, 403);
  assert.equal((await request("/api/account/login-destination", target, "POST")).destination, "/weddingplan");
  const completed = (await admin.auth.admin.getUserById(target.id)).data.user;
  assert.equal(completed.user_metadata.firstTimeLogin, false);
  assert.equal(completed.user_metadata.language, "bm");
  assert.equal(completed.user_metadata.custom_preference, "preserve");
  assert.deepEqual(completed.app_metadata, before.app_metadata);
  assert.equal((await request("/api/account/login-destination", target, "POST")).destination, "/dashboard");
  for (const value of [null, false, "true", 1]) {
    assert.ifError((await admin.auth.admin.updateUserById(target.id, { user_metadata: { firstTimeLogin: value } })).error);
    assert.equal((await request("/api/account/login-destination", target, "POST")).destination, "/dashboard");
  }
  assert.ifError((await admin.auth.admin.updateUserById(actor.id, { user_metadata: { firstTimeLogin: true } })).error);
  assert.equal((await request("/api/account/login-destination", actor, "POST")).destination, "/admin");
  console.log("First login: strict flag, read-only GETs, metadata preservation, admin override and CSRF verified");
  await pageRedirect("/admin/users", target, "/dashboard");
  await pageRedirect("/match/1", target, "/payment?returnTo=%2Fmatch");
  await pageRedirect("/", target, "/dashboard");
  await pageRedirect("/", actor, "/admin");
  await pageRedirect("/login?next=%2Fmatch", target, "/dashboard");
  await pageRedirect("/login?next=%2Fadmin%2Fusers", target, "/dashboard");
  await pageRedirect("/login?next=%2Fadmin%2Fusers", actor, "/admin");
  await pageRedirect("/login?next=https%3A%2F%2Fevil.test", target, "/dashboard");
  for (const next of ["/weddingplan", "/weddingplan/1", "/match", "/dashboard", "/payment"]) {
    await pageRedirect(`/login?next=${encodeURIComponent(next)}`, actor, "/admin");
  }
  await pageRedirect("/login?next=%2Fweddingplan", target, "/dashboard");
  for (const path of ["/weddingplan", "/weddingplan/1", "/dashboard", "/payment?returnTo=%2Fmatch"]) {
    const response = await fetch(`${base}${path}`, { headers: { cookie: target.cookie() }, redirect: "manual" });
    assert.equal(response.status, 200, `${path} should allow signed-in users`);
    assert.equal(response.headers.get("location"), null);
    const html = await response.text();
    assert.equal(html.includes('http-equiv="refresh"'), false, `${path} should not stream a redirect`);
    if (path.startsWith("/payment")) {
      // Cache Components can stream client Link props as escaped Flight JSON.
      const serialized = html.replaceAll(String.fromCharCode(92), "");
      const matchBack = html.includes('href="/match"') || serialized.includes('"href":"/match"');
      assert.ok(matchBack, "Payment Back link must return to matches");
    }
    target.applyCookies(response);
  }
  for (const path of ["/weddingplan/99", "/does-not-exist"]) {
    const response = await fetch(`${base}${path}`, { headers: { cookie: target.cookie() }, redirect: "manual" });
    const html = await response.text();
    assert.ok(response.status === 404 || html.includes("NEXT_HTTP_ERROR_FALLBACK;404"), `${path} must be not-found`);
  }
  await target.expireSession();
  assert.equal((await request("/api/account/access", target)).userId, target.id);
  assert.ok(target.lastCookieWrites > 0, "Proxy must write the refreshed auth cookies");
  console.log("Routing: protected pages, role defaults, ignored login next links, payment Back links, 404s and session refresh verified");
  const locations = await (await fetch(`${base}/api/locations`)).json();
  const allPreferences = [1, 2, 3, 4, 5, 6].map((serviceId) => ({ serviceId, budget: 1e9, location: locations.map((item) => item.id), criteria: {} }));
  const freeResults = await request("/api/match/vendors", target, "POST", allPreferences);
  locked(freeResults);
  const adminResults = await request("/api/match/vendors", actor, "POST", allPreferences);
  assert.equal(freeResults.length, adminResults.length);
  assert.ok(adminResults.length >= freeResults.length);
  console.log(`Result limits: ${freeResults.length} free previews; ${adminResults.length} admin matches`);
  async function metadata(update) {
    const { error } = await admin.auth.admin.updateUserById(target.id, { app_metadata: { ...original, ...update } });
    if (error) throw error;
  }
  for (const scenario of [
    { role: "user", paid_until: null },
    { role: "user", paid_until: "2020-01-01T00:00:00Z" },
    { role: "user", paid_until: "2099-02-30T00:00:00Z" },
    { role: "ADMIN", paid_until: null },
  ]) {
    await metadata(scenario);
    const access = await request("/api/account/access", target);
    assert.equal(access.canViewVendorIdentity, false);
    await request("/api/account/selections", target, "POST", [1], 403);
    await request("/api/admin/users", target, "GET", undefined, 403);
    locked(await request("/api/match/vendors", target, "POST", preferences));
  }
  // A genuine signed session with forged user-editable metadata still has no access.
  const forged = await target.auth.auth.updateUser({ data: { role: "admin", paid_until: "2099-01-01T00:00:00Z" } });
  assert.equal(forged.error, null);
  await request(paidPath, target, "POST", [1], 403);
  console.log("Free, expired, malformed and forged metadata: protected data denied");
  for (const scenario of [{ role: "user", paid_until: "2099-01-01T00:00:00Z" }, { role: "admin", paid_until: null }]) {
    await metadata(scenario);
    assert.equal((await request("/api/account/access", target)).canViewVendorIdentity, true);
    await removed(target);
    const matches = await request("/api/match/vendors", target, "POST", preferences);
    assert.ok(matches.every((match) => !match.identityLocked && typeof match.vendor.vendorName === "string" && match.packages.length));
    assert.ok((await request("/api/account/selections", target, "POST", [1])).length);
  }
  console.log("Paid and admin: full matching data and selected-package resolution verified");
  await metadata({ role: "user", paid_until: null });
  const userPath = `/api/admin/users/${target.id}`;
  await request(userPath, target, "PATCH", { action: "grantPass" }, 403);
  await request(userPath, actor, "PATCH", { action: "setRole", role: "vendor" }, 400);
  await request(`/api/admin/users/${actor.id}`, actor, "PATCH", { action: "setRole", role: "user" }, 403);
  const granted = await request(userPath, actor, "PATCH", { action: "grantPass" });
  assert.equal(granted.isPaid, true);
  const days = (Date.parse(granted.paidUntil) - Date.now()) / 86400000;
  assert.ok(days > 364 && days < 367);
  await request(paidPath, target, "POST", [1]);
  await request(userPath, actor, "PATCH", { action: "revokePass" });
  // Keep the same JWT: getUser must observe revoked metadata without a token refresh.
  await request(paidPath, target, "POST", [1], 403);
  locked(await request("/api/match/vendors", target, "POST", preferences));
  await request(userPath, actor, "PATCH", { action: "setRole", role: "admin" });
  assert.equal((await request("/api/account/access", target)).role, "admin");
  await request(userPath, actor, "PATCH", { action: "setRole", role: "user" });
  const fresh = (await admin.auth.admin.getUserById(target.id)).data.user;
  assert.equal(fresh.app_metadata.custom_flag, "preserve");
  const listed = await request("/api/admin/users?page=1", actor);
  assert.ok(listed.users.length <= 25);
  await request("/api/admin/users?page=0", actor, "GET", undefined, 400);
  console.log("Admin: grant, revoke, role changes, validation, pagination and self-demotion protection verified");
  const publicClient = createClient(url, key, { auth: { persistSession: false } });
  for (const table of ["vendorsTable", "packagesTable"]) {
    const direct = await publicClient.from(table).select("*");
    assert.ok(direct.error, `Anonymous direct ${table} reads must fail`);
    const authenticated = await target.auth.from(table).select("*");
    assert.ok(authenticated.error, `Authenticated direct ${table} reads must fail`);
  }
  console.log("Direct Supabase reads denied for anon and authenticated roles");
  await target.auth.auth.signOut();
  await request(paidPath, target, "POST", [1], 401);
  console.log("Logout: old selection details cannot be reloaded");
} finally {
  for (const id of created) {
    const existing = await admin.auth.admin.getUserById(id);
    if (existing.data.user?.app_metadata.phase1_test !== run) throw new Error("Refusing to delete a non-test account");
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw new Error("Temporary account cleanup failed");
  }
  console.log(`Cleaned up ${created.length} temporary test accounts`);
}
