-- Admin-only RPCs: QR issuing, revoking, CSV import.

create or replace function public._require_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.current_staff_role() is distinct from 'admin' then
    raise exception 'Akses ditolak' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public._require_admin() from public, anon, authenticated;

-- Creates a random token, stores only its SHA-256 hash, returns the plaintext once.
create or replace function public._new_token_for(p_nis text, p_full_name text, p_relationship text, p_phone text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_token text := encode(gen_random_bytes(32), 'hex');
begin
  insert into public.guardians (student_nis, full_name, relationship, phone_number, qr_token_hash)
  values (p_nis, p_full_name, p_relationship, p_phone, encode(digest(v_token, 'sha256'), 'hex'))
  on conflict (student_nis) do update set
    full_name = excluded.full_name,
    relationship = excluded.relationship,
    phone_number = excluded.phone_number,
    qr_token_hash = excluded.qr_token_hash,
    qr_issued_at = now(),
    is_active = true,
    updated_at = now();
  return v_token;
end;
$$;
revoke all on function public._new_token_for(text, text, text, text) from public, anon, authenticated;

create or replace function public.issue_qr(p_nis text, p_full_name text, p_relationship text, p_phone text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public._require_admin();
  if not exists (select 1 from public.students where nis = p_nis) then
    raise exception 'Murid tidak ditemukan' using errcode = 'P0002';
  end if;
  return public._new_token_for(p_nis, p_full_name, p_relationship, p_phone);
end;
$$;

create or replace function public.revoke_qr(p_nis text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._require_admin();
  update public.guardians set is_active = false, updated_at = now() where student_nis = p_nis;
end;
$$;

create or replace function public.import_students(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row jsonb;
  v_i int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_issued jsonb := '[]'::jsonb;
  v_seen text[] := '{}';
  v_nis text;
  v_field text;
  v_token text;
begin
  perform public._require_admin();

  -- validate everything first: all or nothing
  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_i := v_i + 1;
    foreach v_field in array array['nis','nama_murid','kelas','nama_wali','hubungan','no_hp'] loop
      if nullif(trim(coalesce(v_row->>v_field, '')), '') is null then
        v_errors := v_errors || jsonb_build_object('row', v_i, 'message', 'Kolom ' || v_field || ' wajib diisi.');
      end if;
    end loop;
    v_nis := trim(coalesce(v_row->>'nis', ''));
    if v_nis <> '' then
      if v_nis = any (v_seen) then
        v_errors := v_errors || jsonb_build_object('row', v_i, 'message', 'NIS ' || v_nis || ' dobel di file.');
      end if;
      v_seen := v_seen || v_nis;
    end if;
  end loop;
  if jsonb_array_length(v_errors) > 0 then
    return jsonb_build_object('ok', false, 'errors', v_errors);
  end if;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_nis := trim(v_row->>'nis');
    insert into public.students (nis, full_name, nickname, class_name)
    values (v_nis, trim(v_row->>'nama_murid'), nullif(trim(coalesce(v_row->>'panggilan', '')), ''), trim(v_row->>'kelas'))
    on conflict (nis) do update set
      full_name = excluded.full_name, nickname = excluded.nickname,
      class_name = excluded.class_name, updated_at = now();

    if exists (select 1 from public.guardians where student_nis = v_nis) then
      update public.guardians set
        full_name = trim(v_row->>'nama_wali'), relationship = trim(v_row->>'hubungan'),
        phone_number = trim(v_row->>'no_hp'), updated_at = now()
      where student_nis = v_nis;
    else
      v_token := public._new_token_for(v_nis, trim(v_row->>'nama_wali'), trim(v_row->>'hubungan'), trim(v_row->>'no_hp'));
      v_issued := v_issued || jsonb_build_object(
        'nis', v_nis, 'student_name', trim(v_row->>'nama_murid'),
        'class_name', trim(v_row->>'kelas'), 'token', v_token);
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'issued', v_issued);
end;
$$;

revoke all on function public.issue_qr(text, text, text, text) from public, anon;
revoke all on function public.revoke_qr(text) from public, anon;
revoke all on function public.import_students(jsonb) from public, anon;
grant execute on function public.issue_qr(text, text, text, text) to authenticated;
grant execute on function public.revoke_qr(text) to authenticated;
grant execute on function public.import_students(jsonb) to authenticated;
