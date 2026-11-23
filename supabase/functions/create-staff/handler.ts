export type Deps = {
  getCallerRole: (authHeader: string) => Promise<string | null>;
  createAuthUser: (email: string, password: string) => Promise<{ id: string }>;
  insertStaff: (row: { id: string; full_name: string; role: string }) => Promise<void>;
  deleteAuthUser: (id: string) => Promise<void>;
};

// The browser preview calls this function cross-origin, so every response needs CORS headers.
const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json', ...cors } });

export const createHandler = (deps: Deps) => async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  const auth = req.headers.get('authorization');
  if (!auth) return json(401, { error: 'Belum login.' });
  if ((await deps.getCallerRole(auth)) !== 'admin') return json(403, { error: 'Hanya admin.' });

  const b = await req.json().catch(() => null);
  const ok = b && typeof b.email === 'string' && b.email.includes('@')
    && typeof b.password === 'string' && b.password.length >= 8
    && typeof b.full_name === 'string' && b.full_name.trim() !== ''
    && (b.role === 'petugas' || b.role === 'admin');
  if (!ok) return json(400, { error: 'Data tidak valid.' });

  const user = await deps.createAuthUser(b.email, b.password);
  try {
    await deps.insertStaff({ id: user.id, full_name: b.full_name.trim(), role: b.role });
  } catch {
    await deps.deleteAuthUser(user.id);
    return json(500, { error: 'Gagal membuat akun.' });
  }
  return json(201, { id: user.id });
};
