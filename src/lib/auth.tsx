import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
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

  useEffect(() => {
    const resolve = async (s: Session | null) => {
      setSession(s);
      if (!s) { setRole(null); setLoading(false); return; }
      const { data } = await supabase.rpc('current_staff_role');
      if (data !== 'petugas' && data !== 'admin') {
        await supabase.auth.signOut(); // deactivated or unknown staff
        setSession(null); setRole(null);
      } else {
        setRole(data);
      }
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data }) => resolve(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { void resolve(s); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? 'Email atau kata sandi salah.' : null;
  };
  const signOut = async () => { await supabase.auth.signOut(); };

  return <Ctx.Provider value={{ session, role, loading, signIn, signOut }}>{children}</Ctx.Provider>;
}
