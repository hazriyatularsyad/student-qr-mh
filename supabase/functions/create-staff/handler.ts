export type Deps = {
  getCallerRole: (authHeader: string) => Promise<string | null>;
  createAuthUser: (email: string, password: string) => Promise<{ id: string }>;
  insertStaff: (row: { id: string; full_name: string; role: string }) => Promise<void>;
  deleteAuthUser: (id: string) => Promise<void>;
};

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });

export const createHandler = (deps: Deps) => async (req: Request): Promise<Response> => {
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
