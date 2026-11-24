import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
const require = createRequire(import.meta.url);
function stub(path, exports) {
  const id = require.resolve(path);
  require.cache[id] = { id, filename: id, loaded: true, exports };
}
let current;
let fail = false;
const updates = [];
stub('server-only', {});
stub('next/headers', { cookies: async () => ({}) });
stub('../src/services/others/accountAccessService.ts', { getVerifiedAccountUser: async () => current });
stub('../src/utils/supabase/server.ts', { createClient: () => ({ auth: { updateUser: async ({ data }) => {
  updates.push(data);
  if (fail) return { error: new Error('Simulated update failure') };
  current.user_metadata = { ...current.user_metadata, ...data };
  return { error: null };
} } }) });
let signup;
stub('../src/utils/supabase/client.ts', { createClient: () => ({ auth: { signUp: async (input) => { signup = input; return { data: { session: null }, error: null }; } } }) });
const { resolveLoginDestination } = await import('../src/services/others/loginRoutingService.ts');
const { APICreateAuthAccount } = await import('../src/services/api/auth.ts');

test('first-login routing reads without mutations, preserves metadata and fails safely', async () => {
  current = { id: 'customer', app_metadata: { role: 'user', custom: 'preserve' }, user_metadata: { firstTimeLogin: true, language: 'bm' } };
  assert.equal(await resolveLoginDestination(), '/weddingplan');
  assert.equal(updates.length, 0);
  assert.equal(current.user_metadata.firstTimeLogin, true);
  fail = true;
  await assert.rejects(resolveLoginDestination(true), (error) => error.status === 503);
  assert.equal(current.user_metadata.firstTimeLogin, true);
  fail = false;
  assert.equal(await resolveLoginDestination(true), '/weddingplan');
  assert.deepEqual(current.user_metadata, { firstTimeLogin: false, language: 'bm' });
  assert.deepEqual(current.app_metadata, { role: 'user', custom: 'preserve' });
  assert.equal(await resolveLoginDestination(true), '/dashboard');
  const count = updates.length;
  for (const value of [undefined, null, false, 'true', 1]) {
    current.user_metadata.firstTimeLogin = value;
    assert.equal(await resolveLoginDestination(true), '/dashboard');
  }
  current.app_metadata.role = 'admin'; current.user_metadata.firstTimeLogin = true;
  assert.equal(await resolveLoginDestination(true), '/admin');
  assert.equal(updates.length, count);
  current = null;
  assert.equal(await resolveLoginDestination(true), null);
});

test('registration sets the flag even when email confirmation returns no session', async () => {
  const result = await APICreateAuthAccount('test@example.test', 'not-a-real-password');
  assert.deepEqual(signup.options, { data: { firstTimeLogin: true } });
  assert.equal(result.data.session, null);
});
