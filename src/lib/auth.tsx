import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type Role = 'petugas' | 'admin' | null;
type AuthValue = {
  session: Session | null;
  role: Role;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthValue>({
  session: null, role: null, loading: true,
  signIn: async () => null, signOut: async () => {},
});
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  // One lookup per access token: the SIGNED_IN event and signIn() would otherwise race,
  // and a failed duplicate would sign out a perfectly good session.
  const inflight = useRef(new Map<string, Promise<Role>>());

  // Looks up the staff role for a session; signs out accounts that are not active staff.
  const resolve = useCallback((s: Session | null): Promise<Role> => {
    const key = s?.access_token;
    const pending = key ? inflight.current.get(key) : undefined;
    if (pending) return pending;

    const run = (async (): Promise<Role> => {
      setSession(s);
      if (!s) { setRole(null); setLoading(false); return null; }
      const { data } = await supabase.rpc('current_staff_role');
      if (data !== 'petugas' && data !== 'admin') {
        await supabase.auth.signOut(); // deactivated or unknown staff
        setSession(null); setRole(null); setLoading(false);
        return null;
      }
      setRole(data); setLoading(false);
      return data;
    })();
    if (key) {
      inflight.current.set(key, run);
      void run.finally(() => inflight.current.delete(key));
    }
    return run;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => resolve(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { void resolve(s); });
    return () => sub.subscription.unsubscribe();
  }, [resolve]);

  // Resolves only once the role is known, so the caller can navigate straight away.
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) return 'Email atau kata sandi salah.';
    const r = await resolve(data.session);
    return r ? null : 'Akun ini belum terdaftar sebagai petugas atau admin.';
  };
  const signOut = async () => { await supabase.auth.signOut(); };

  return <Ctx.Provider value={{ session, role, loading, signIn, signOut }}>{children}</Ctx.Provider>;
}
