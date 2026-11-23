-- Admins can re-display and download a guardian's QR, so the plaintext token is kept in a
-- separate admin-only table. Scanning still verifies against guardians.qr_token_hash.

create table public.guardian_qr_tokens (
  guardian_id uuid primary key references public.guardians(id) on delete cascade,
  token text not null,
  created_at timestamptz not null default now()
);

alter table public.guardian_qr_tokens enable row level security;
grant select on public.guardian_qr_tokens to authenticated;
create policy qr_tokens_admin_read on public.guardian_qr_tokens for select to authenticated
  using (public.current_staff_role() = 'admin');

create or replace function public._new_token_for(p_nis text, p_full_name text, p_relationship text, p_phone text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_token text := encode(gen_random_bytes(32), 'hex');
  v_gid uuid;
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
    updated_at = now()
  returning id into v_gid;

  insert into public.guardian_qr_tokens (guardian_id, token) values (v_gid, v_token)
  on conflict (guardian_id) do update set token = excluded.token, created_at = now();
  return v_token;
end;
$$;
revoke all on function public._new_token_for(text, text, text, text) from public, anon, authenticated;

create or replace function public.revoke_qr(p_nis text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._require_admin();
  update public.guardians set is_active = false, updated_at = now() where student_nis = p_nis;
  delete from public.guardian_qr_tokens where guardian_id in (select id from public.guardians where student_nis = p_nis);
end;
$$;
revoke all on function public.revoke_qr(text) from public, anon;
grant execute on function public.revoke_qr(text) to authenticated;
