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
let userId;
try {
  const { data, error } = await admin.auth.admin.createUser({ email: `search-rollback-${run}@example.test`, email_confirm: true, app_metadata: { search_test: run } });
  assert.ifError(error); userId = data.user.id;
  const free = { userId, role: 'user', isPaid: false, paidUntil: null, canViewVendorIdentity: false };
  const preferences = [{ serviceId: 3, budget: 13, location: [1], criteria: {} }];
  const id = randomUUID();
  await assert.rejects(runManualSearch(free, id, preferences), /Simulated matching failure/);
  assert.equal((await getManualSearchUsage(free)).used, 0);
  const rows = await db.execute(sql`select count(*)::integer as count from public.manual_search_snapshots where user_id = ${userId}`);
  assert.equal(rows[0].count, 0);
  preferences[0].budget = 100;
  assert.equal((await runManualSearch(free, id, preferences)).usage.used, 1);
  const callsBefore = calls;
  await runManualSearch(free, id, preferences);
  assert.equal(calls, callsBefore, 'Saved search must not rerun matching');
  // A full previous-day bucket must not reduce today's allowance.
  await db.execute(sql`insert into public.manual_search_usage (user_id, day, used) values (${userId}, ((now() at time zone 'Asia/Kuala_Lumpur')::date - 1), 3)`);
  assert.equal((await getManualSearchUsage(free)).remaining, 2);
  // Deny the browser roles even when they know the user's ID.
  const grants = await db.execute(sql`select has_table_privilege('anon', 'public.manual_search_results', 'SELECT') as anon, has_table_privilege('authenticated', 'public.manual_search_results', 'SELECT') as authenticated`);
  assert.equal(grants[0].anon, false); assert.equal(grants[0].authenticated, false);
  console.log('PASS: real transaction rollback on matching failure, retry recovery, zero rematching on refresh, day isolation and denied browser grants.');
} finally {
  if (userId) {
    const { data } = await admin.auth.admin.getUserById(userId);
    if (data.user?.app_metadata.search_test === run) assert.ifError((await admin.auth.admin.deleteUser(userId)).error);
  }
  await db.$client.end();
}
