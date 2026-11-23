import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Display name of the signed-in staff member (own row is readable under RLS).
export function useMyName(): string | null {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    if (!uid) return;
    let live = true;
    supabase.from('staff').select('full_name').eq('id', uid).maybeSingle()
      .then(({ data }) => { if (live) setName((data?.full_name as string | undefined) ?? null); });
    return () => { live = false; };
  }, [uid]);
  return name ?? session?.user.email?.split('@')[0] ?? null;
}
