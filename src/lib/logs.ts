import { supabase } from '@/lib/supabase';
import type { LogRow } from '@/lib/types';

export type LogFilters = { date?: string; status?: string; class?: string; q?: string };

export async function listLogs(f: LogFilters = {}): Promise<LogRow[]> {
  const { data, error } = await supabase.rpc('list_pickup_logs', {
    p_date: f.date || null,
    p_status: f.status || null,
    p_class: f.class || null,
    p_q: f.q || null,
  });
  if (error) throw error;
  return (data ?? []) as LogRow[];
}
