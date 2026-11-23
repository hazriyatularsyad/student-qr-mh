import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHandler } from './handler.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(createHandler({
  getCallerRole: async (authHeader) => {
    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data } = await caller.rpc('current_staff_role');
    return (data as string | null) ?? null;
  },
  createAuthUser: async (email, password) => {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) throw error ?? new Error('createUser failed');
    return { id: data.user.id };
  },
  insertStaff: async (row) => {
    const { error } = await admin.from('staff').insert(row);
    if (error) throw error;
  },
  deleteAuthUser: async (id) => { await admin.auth.admin.deleteUser(id); },
}));
