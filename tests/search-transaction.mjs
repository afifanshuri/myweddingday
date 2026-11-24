import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { createClient } from '@supabase/supabase-js';

assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, 'mbrdrexnhxihqlyqukmx.supabase.co');
let calls = 0;
globalThis.__searchTestMatch = async (preferences) => {
  calls++;
  if (preferences[0].budget === 13) throw new Error('Simulated matching failure');
  return [];
};
const require = createRequire(import.meta.url);
function stub(path, exports) {
  const id = require.resolve(path);
  require.cache[id] = { id, filename: id, loaded: true, exports };
}
stub('server-only', {});
stub('../src/db/queries/vendors.ts', { findVendorsByPreferences: (...args) => globalThis.__searchTestMatch(...args) });
const { runManualSearch, getManualSearchUsage } = await import('../src/services/others/manualSearchService.ts');
const { db } = await import('../src/db/index.ts');
const { sql } = await import('drizzle-orm');
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PRIVATE_SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const run = randomUUID();
const userIds = [];
async function freeAccount(label) {
  const { data, error } = await admin.auth.admin.createUser({ email: `search-${label}-${run}@example.test`, email_confirm: true, app_metadata: { search_test: run } });
  assert.ifError(error); userIds.push(data.user.id);
  return { userId: data.user.id, role: 'user', isPaid: false, paidUntil: null, canViewVendorIdentity: false };
}
const count = async (table, userId) => (await db.execute(sql`select count(*)::integer as count from ${sql.raw(`public.${table}`)} where user_id = ${userId}`))[0].count;
try {
  const free = await freeAccount('rollback');
  const preferences = [{ serviceId: 3, budget: 13, location: [1], criteria: {} }];
  const id = randomUUID();
  // A failed search rolls back completely: no saved search, and the free search isn't used up.
  await assert.rejects(runManualSearch(free, id, preferences), /Simulated matching failure/);
  assert.equal((await getManualSearchUsage(free)).used, 0);
  assert.equal(await count('manual_search_snapshots', free.userId), 0);
  assert.equal(await count('free_searches', free.userId), 0);
  preferences[0].budget = 100;
  const first = await runManualSearch(free, id, preferences);
  assert.equal(first.usage.used, 1); assert.equal(first.usage.remaining, 0);
  assert.equal(await count('free_searches', free.userId), 1);
  const callsBefore = calls;
  await runManualSearch(free, id, preferences);
  assert.equal(calls, callsBefore, 'Saved search must not rerun matching');
  // One free search, ever: a different search is refused without running the matching.
  await assert.rejects(runManualSearch(free, randomUUID(), preferences), (error) => error.status === 403 && /free search/.test(error.message));
  assert.equal(calls, callsBefore);

  // Several different searches started at the same moment: exactly one succeeds.
  const racer = await freeAccount('race');
  const outcomes = await Promise.allSettled(Array.from({ length: 4 }, () => runManualSearch(racer, randomUUID(), preferences)));
  assert.equal(outcomes.filter((outcome) => outcome.status === 'fulfilled').length, 1);
  assert.ok(outcomes.filter((outcome) => outcome.status === 'rejected').every((outcome) => outcome.reason.status === 403));
  assert.equal(await count('free_searches', racer.userId), 1);
  assert.equal(await count('manual_search_snapshots', racer.userId), 1);

  // Plus and admins are unlimited and never use up a free search.
  const plus = { ...(await freeAccount('plus')), isPaid: true, canViewVendorIdentity: true };
  for (let i = 0; i < 3; i++) assert.equal((await runManualSearch(plus, randomUUID(), preferences)).usage.limit, null);
  assert.equal(await count('free_searches', plus.userId), 0);

  // Deny the browser roles even when they know the user's ID.
  for (const table of ['free_searches', 'unlocked_vendors', 'manual_search_snapshots']) {
    const grants = await db.execute(sql`select has_table_privilege('anon', ${`public.${table}`}, 'SELECT') as anon, has_table_privilege('authenticated', ${`public.${table}`}, 'SELECT') as authenticated`);
    assert.equal(grants[0].anon, false); assert.equal(grants[0].authenticated, false);
  }
  console.log('PASS: real transaction rollback on matching failure, retry recovery, zero rematching on refresh, one free search (also when racing), Plus unlimited, and denied browser grants.');
} finally {
  for (const userId of userIds) {
    const { data } = await admin.auth.admin.getUserById(userId);
    if (data.user?.app_metadata.search_test === run) assert.ifError((await admin.auth.admin.deleteUser(userId)).error);
  }
  await db.$client.end();
}
