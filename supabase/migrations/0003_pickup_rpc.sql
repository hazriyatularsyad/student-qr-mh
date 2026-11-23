-- check_pickup / confirm_pickup. Scanner identity always comes from auth.uid().

create or replace function public._scanner_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  select id into v_id from public.staff
  where id = auth.uid() and is_active and role = 'petugas';
  if v_id is null then
    raise exception 'Akses ditolak' using errcode = '42501';
  end if;
  return v_id;
end;
$$;
revoke all on function public._scanner_id() from public, anon, authenticated;

create or replace function public._student_json(s public.students, with_photo boolean)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'nis', s.nis,
    'full_name', s.full_name,
    'nickname', coalesce(nullif(trim(s.nickname), ''), s.full_name),
    'class_name', s.class_name
  ) || case when with_photo then jsonb_build_object('photo_url', s.photo_url) else '{}'::jsonb end
$$;
revoke all on function public._student_json(public.students, boolean) from public, anon, authenticated;

create or replace function public.check_pickup(p_token text, p_device_info jsonb default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_scanner uuid := public._scanner_id();
  v_g public.guardians;
  v_s public.students;
  v_prev record;
begin
  select * into v_g from public.guardians
  where qr_token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex') and is_active;
  if v_g.id is not null then
    select * into v_s from public.students where nis = v_g.student_nis and is_active;
  end if;

  if v_g.id is null or v_s.nis is null then
    insert into public.pickup_logs (student_nis, guardian_id, scanner_id, status, notes, device_info)
    values (v_g.student_nis, v_g.id, v_scanner, 'rejected', 'QR tidak valid', p_device_info);
    return jsonb_build_object('status', 'rejected',
      'message', 'QR Code tidak valid, dicabut, atau murid nonaktif.');
  end if;

  select l.scanned_at, st.full_name as scanner_name into v_prev
  from public.pickup_logs l join public.staff st on st.id = l.scanner_id
  where l.student_nis = v_s.nis and l.pickup_date = public.jakarta_today() and l.status = 'verified';

  if found then
    insert into public.pickup_logs (student_nis, guardian_id, scanner_id, status, notes, device_info)
    values (v_s.nis, v_g.id, v_scanner, 'duplicate', 'Percobaan pemindaian ulang', p_device_info);
    return jsonb_build_object('status', 'duplicate',
      'message', 'Murid ini sudah dijemput hari ini.',
      'previous_scanned_at', v_prev.scanned_at,
      'previous_scanner_name', v_prev.scanner_name,
      'student', public._student_json(v_s, false));
  end if;

  return jsonb_build_object('status', 'ready',
    'message', 'Siap dikonfirmasi.',
    'student', public._student_json(v_s, true),
    'guardian', jsonb_build_object('full_name', v_g.full_name, 'relationship', v_g.relationship));
end;
$$;

create or replace function public.confirm_pickup(
  p_token text,
  p_substitute_name text default null,
  p_substitute_status text default null,
  p_device_info jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_scanner uuid := public._scanner_id();
  v_name text := nullif(trim(p_substitute_name), '');
  v_status text := nullif(trim(p_substitute_status), '');
  v_g public.guardians;
  v_s public.students;
  v_prev record;
  v_log_id uuid;
  v_at timestamptz;
begin
  if (v_name is null) <> (v_status is null) then
    return jsonb_build_object('status', 'rejected', 'message', 'Data penjemput pengganti tidak lengkap.');
  end if;

  select * into v_g from public.guardians
  where qr_token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex') and is_active;
  if v_g.id is not null then
    select * into v_s from public.students where nis = v_g.student_nis and is_active;
  end if;
  if v_g.id is null or v_s.nis is null then
    insert into public.pickup_logs (student_nis, guardian_id, scanner_id, status, notes, device_info)
    values (v_g.student_nis, v_g.id, v_scanner, 'rejected', 'QR tidak valid', p_device_info);
    return jsonb_build_object('status', 'rejected',
      'message', 'QR Code tidak valid, dicabut, atau murid nonaktif.');
  end if;

  begin
    insert into public.pickup_logs
      (student_nis, guardian_id, scanner_id, status, substitute_name, substitute_status, device_info)
    values (v_s.nis, v_g.id, v_scanner, 'verified', v_name, v_status, p_device_info)
    returning id, scanned_at into v_log_id, v_at;
  exception when unique_violation then
    select l.scanned_at, st.full_name as scanner_name into v_prev
    from public.pickup_logs l join public.staff st on st.id = l.scanner_id
    where l.student_nis = v_s.nis and l.pickup_date = public.jakarta_today() and l.status = 'verified';
    insert into public.pickup_logs (student_nis, guardian_id, scanner_id, status, notes, device_info)
    values (v_s.nis, v_g.id, v_scanner, 'duplicate', 'Percobaan pemindaian ulang', p_device_info);
    return jsonb_build_object('status', 'duplicate',
      'message', 'Murid ini sudah dijemput hari ini.',
      'previous_scanned_at', v_prev.scanned_at,
      'previous_scanner_name', v_prev.scanner_name,
      'student', public._student_json(v_s, false));
  end;

  return jsonb_build_object('status', 'verified',
    'message', 'Verifikasi berhasil.',
    'log_id', v_log_id,
    'scanned_at', v_at,
    'student', public._student_json(v_s, true),
    'guardian', jsonb_build_object('full_name', v_g.full_name, 'relationship', v_g.relationship));
end;
$$;

revoke all on function public.check_pickup(text, jsonb) from public, anon;
revoke all on function public.confirm_pickup(text, text, text, jsonb) from public, anon;
grant execute on function public.check_pickup(text, jsonb) to authenticated;
grant execute on function public.confirm_pickup(text, text, text, jsonb) to authenticated;
