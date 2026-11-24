import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import postgres from 'postgres';

const base = process.argv[2] ?? 'http://localhost:3000';
assert.equal(new URL(base).hostname, 'localhost');
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, 'mbrdrexnhxihqlyqukmx.supabase.co');
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PRIVATE_SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const db = postgres(process.env.DATABASE_URL, { prepare: false, max: 3 });
const run = randomUUID();
const created = [];
async function account(role) {
  const email = `search-${run}-${role}@example.test`;
  const password = `Search-${randomUUID()}!8a`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { role, search_test: run } });
  assert.ifError(error); created.push(data.user.id);
  const jar = new Map();
  const auth = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { autoRefreshToken: false }, cookies: {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: (cookies) => cookies.forEach(({ name, value }) => jar.set(name, value)),
  } });
  assert.ifError((await auth.auth.signInWithPassword({ email, password })).error);
  return { id: data.user.id, cookie: () => [...jar].map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join('; ') };
}
const preferences = [{ serviceId: 3, budget: 1000000, location: [1], criteria: {} }];
async function request(account, id, body = preferences, expected = 200) {
  const response = await fetch(`${base}/api/match/vendors`, { signal: AbortSignal.timeout(90000), method: 'POST', headers: { ...(account ? { cookie: account.cookie() } : {}), 'content-type': 'application/json', 'Idempotency-Key': id, origin: base }, body: JSON.stringify(body) });
  const data = await response.json();
  assert.equal(response.status, expected, `${response.status}: ${JSON.stringify(data)}`);
  assert.match(response.headers.get('cache-control'), /no-store/);
  return response.ok ? { ...data, top: data.topMatches, list: data.matches, matches: [...data.topMatches, ...data.matches] } : data;
}
// Free accounts: locked top picks; the list holds only the vendors the free search unlocked, in full.
function freeView(result) {
  assert.ok(result.top.length > 0);
  assert.ok(result.top.every((match) => match.identityLocked && !('packages' in match) && !('vendorName' in match.vendor)));
  assert.ok(result.list.every((match) => !match.identityLocked && typeof match.vendor.vendorName === 'string'));
}
try {
  const free = await account('user');
  const operator = await account('admin');
  await request(null, randomUUID(), preferences, 401);
  await request(free, randomUUID(), [], 400);
  const id = randomUUID();
  // The free search: three concurrent retries of the same search count once.
  const repeated = await Promise.all(Array.from({ length: 3 }, () => request(free, id)));
  assert.ok(repeated.every((result) => result.usage.used === 1 && result.usage.limit === 1));
  assert.equal(repeated[0].usage.remaining, 0);
  freeView(repeated[0]);
  await request(free, id, [{ ...preferences[0], budget: 500 }], 409);
  // Any other search is refused: one free search, ever (even several at once).
  const newIds = Array.from({ length: 4 }, randomUUID);
  const responses = await Promise.all(newIds.map(async (searchId) => {
    const response = await fetch(`${base}/api/match/vendors`, { signal: AbortSignal.timeout(90000), method: 'POST', headers: { cookie: free.cookie(), 'content-type': 'application/json', 'Idempotency-Key': searchId, origin: base }, body: JSON.stringify(preferences) });
    return { status: response.status, body: await response.json() };
  }));
  assert.ok(responses.every((result) => result.status === 403 && /free search/.test(result.body.error)), JSON.stringify(responses.map((r) => r.status)));
  const refreshed = await request(free, id);
  assert.equal(refreshed.usage.used, 1);
  assert.equal(refreshed.usage.remaining, 0);
  assert.deepEqual(refreshed.matches.map((match) => match.vendor.id), repeated[0].matches.map((match) => match.vendor.id));
  // Change only this test account's private snapshot to prove retries read the snapshot.
  await db`update public.manual_search_snapshots set matches = '[]'::jsonb where user_id = ${free.id} and search_id = ${id}`;
  assert.deepEqual((await request(free, id)).matches, []);
  await request(operator, id); // same ID is isolated per account
  for (let i = 0; i < 4; i++) assert.equal((await request(operator, randomUUID())).usage.limit, null);
  // This suite tests the free search; throttling is exercised separately.
  await db`delete from public.search_request_limits where user_id = ${free.id}`;
  await admin.auth.admin.updateUserById(free.id, { app_metadata: { role: 'user', search_test: run, paid_until: '2099-01-01T00:00:00Z' } });
  const paid = await request(free, newIds[2]);
  assert.equal(paid.usage.limit, null);
  assert.equal(paid.lockedCount, 0);
  assert.ok(paid.matches.every((match) => !match.identityLocked && 'packages' in match));
  await admin.auth.admin.updateUserById(free.id, { app_metadata: { role: 'user', search_test: run, paid_until: null } });
  // After Plus ends, the search made with Plus is shown the free way again.
  freeView(await request(free, newIds[2]));
  const usageResponse = await fetch(`${base}/api/account/search-usage`, { signal: AbortSignal.timeout(90000), headers: { cookie: free.cookie() } });
  assert.equal((await usageResponse.json()).remaining, 0);
  console.log('PASS: guest/invalid requests, concurrent retries, one free search (also when concurrent), saved refresh, account isolation, paid/admin exemptions and revoked-access redaction.');
} finally {
  for (const id of created) {
    const { data } = await admin.auth.admin.getUserById(id);
    if (data.user?.app_metadata.search_test === run) assert.ifError((await admin.auth.admin.deleteUser(id)).error);
  }
  await db.end();
}
