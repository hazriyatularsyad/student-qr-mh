import { supabase } from '@/lib/supabase';
import type { ImportRow } from '@/lib/csv';

export type ImportResult =
  | { ok: true; issued: { nis: string; student_name: string; class_name: string; token: string }[] }
  | { ok: false; errors: { row: number; message: string }[] };

export type Student = {
  nis: string; full_name: string; nickname: string | null; class_name: string;
  photo_url: string | null; is_active: boolean;
};
export type Guardian = { student_nis: string; full_name: string; relationship: string; phone_number: string; is_active: boolean };
export type StaffRow = { id: string; full_name: string; role: 'petugas' | 'admin'; is_active: boolean };

export async function importStudents(rows: ImportRow[]): Promise<ImportResult> {
  const { data, error } = await supabase.rpc('import_students', { p_rows: rows });
  if (error) throw error;
  return data as ImportResult;
}

export async function issueQr(nis: string, fullName: string, relationship: string, phone: string): Promise<string> {
  const { data, error } = await supabase.rpc('issue_qr', {
    p_nis: nis, p_full_name: fullName, p_relationship: relationship, p_phone: phone,
  });
  if (error) throw error;
  return data as string;
}

export async function revokeQr(nis: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_qr', { p_nis: nis });
  if (error) throw error;
}

export async function listStudents(q = ''): Promise<Student[]> {
  let query = supabase.from('students').select('*').order('class_name').order('full_name').limit(300);
  if (q) query = query.or(`full_name.ilike.%${q}%,nis.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Student[];
}

export async function saveStudent(s: Pick<Student, 'nis' | 'full_name' | 'nickname' | 'class_name'>): Promise<void> {
  const { error } = await supabase.from('students').upsert({ ...s, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function setStudentActive(nis: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('students').update({ is_active: active }).eq('nis', nis);
  if (error) throw error;
}

export async function getGuardian(nis: string): Promise<Guardian | null> {
  const { data, error } = await supabase.from('guardians')
    .select('student_nis, full_name, relationship, phone_number, is_active').eq('student_nis', nis).maybeSingle();
  if (error) throw error;
  return data as Guardian | null;
}

export async function uploadPhoto(nis: string, uri: string): Promise<void> {
  const path = `${nis}.jpg`;
  const body = await (await fetch(uri)).arrayBuffer();
  const up = await supabase.storage.from('student-photos').upload(path, body, { contentType: 'image/jpeg', upsert: true });
  if (up.error) throw up.error;
  const { error } = await supabase.from('students').update({ photo_url: path }).eq('nis', nis);
  if (error) throw error;
}

export async function listStaff(): Promise<StaffRow[]> {
  const { data, error } = await supabase.from('staff').select('id, full_name, role, is_active').order('full_name');
  if (error) throw error;
  return (data ?? []) as StaffRow[];
}

export async function setStaffActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('staff').update({ is_active: active }).eq('id', id);
  if (error) throw error;
}

export async function createStaff(b: { email: string; password: string; full_name: string; role: 'petugas' | 'admin' }): Promise<void> {
  const { error } = await supabase.functions.invoke('create-staff', { body: b });
  if (error) throw error;
}

export async function getCounts(): Promise<{ students: number; staff: number }> {
  const [a, b] = await Promise.all([
    supabase.from('students').select('nis', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('staff').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);
  if (a.error) throw a.error;
  if (b.error) throw b.error;
  return { students: a.count ?? 0, staff: b.count ?? 0 };
}
