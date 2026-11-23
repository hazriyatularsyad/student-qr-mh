import assert from 'node:assert/strict';
import { createHandler, type Deps } from './handler.ts';

const body = { email: 'a@b.id', password: 'secret123', full_name: 'Petugas', role: 'petugas' };
const req = (init: { auth?: string; body?: unknown } = {}) =>
  new Request('http://x/create-staff', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(init.auth ? { authorization: init.auth } : {}) },
    body: JSON.stringify(init.body ?? body),
  });

const deps = (callerRole: string | null, calls: string[] = []): Deps => ({
  getCallerRole: async () => callerRole,
  createAuthUser: async () => { calls.push('createAuthUser'); return { id: 'new-id' }; },
  insertStaff: async () => { calls.push('insertStaff'); },
  deleteAuthUser: async () => { calls.push('deleteAuthUser'); },
});

Deno.test('401 without a JWT', async () => {
  assert.equal((await createHandler(deps('admin'))(req())).status, 401);
});

Deno.test('403 for a petugas', async () => {
  assert.equal((await createHandler(deps('petugas'))(req({ auth: 'Bearer t' }))).status, 403);
});

Deno.test('400 for an invalid role', async () => {
  const res = await createHandler(deps('admin'))(req({ auth: 'Bearer t', body: { ...body, role: 'root' } }));
  assert.equal(res.status, 400);
});

Deno.test('201 and id for an admin', async () => {
  const res = await createHandler(deps('admin'))(req({ auth: 'Bearer t' }));
  assert.equal(res.status, 201);
  assert.deepEqual(await res.json(), { id: 'new-id' });
});

Deno.test('removes the auth user when the staff insert fails', async () => {
  const calls: string[] = [];
  const d = deps('admin', calls);
  d.insertStaff = async () => { throw new Error('boom'); };
  const res = await createHandler(d)(req({ auth: 'Bearer t' }));
  assert.equal(res.status, 500);
  assert.ok(calls.includes('deleteAuthUser'));
});
