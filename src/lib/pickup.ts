import { supabase } from '@/lib/supabase';
import type { CheckResult, ConfirmResult, Substitute } from '@/lib/types';

export async function checkPickup(token: string): Promise<CheckResult> {
  const { data, error } = await supabase.rpc('check_pickup', { p_token: token });
  if (error) throw error;
  return data as CheckResult;
}

export async function confirmPickup(token: string, substitute?: Substitute): Promise<ConfirmResult> {
  const { data, error } = await supabase.rpc('confirm_pickup', {
    p_token: token,
    p_substitute_name: substitute?.name ?? null,
    p_substitute_status: substitute?.status ?? null,
  });
  if (error) throw error;
  return data as ConfirmResult;
}
