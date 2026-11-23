-- Role helper, RLS, log RPC, photo bucket.

create or replace function public.current_staff_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.staff where id = auth.uid() and is_active
$$;

revoke all on function public.current_staff_role() from public, anon;
grant execute on function public.current_staff_role() to authenticated;

alter table public.staff enable row level security;
alter table public.students enable row level security;
alter table public.guardians enable row level security;
alter table public.pickup_logs enable row level security;

-- table privileges (RLS below narrows them; pickup_logs gets none)
grant select, insert, update, delete on public.staff, public.students, public.guardians to authenticated;

-- staff: read own row, admin full access
create policy staff_select on public.staff for select to authenticated
  using (id = auth.uid() or public.current_staff_role() = 'admin');
create policy staff_admin_write on public.staff for all to authenticated
  using (public.current_staff_role() = 'admin')
  with check (public.current_staff_role() = 'admin');

-- students / guardians: admin only (petugas go through RPCs)
create policy students_admin on public.students for all to authenticated
  using (public.current_staff_role() = 'admin')
  with check (public.current_staff_role() = 'admin');
create policy guardians_admin on public.guardians for all to authenticated
  using (public.current_staff_role() = 'admin')
  with check (public.current_staff_role() = 'admin');

-- pickup_logs: no direct access; only RPCs (security definer)

create or replace function public.list_pickup_logs(
  p_date date default null,
  p_status text default null,
  p_class text default null,
  p_q text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text := public.current_staff_role();
  v_result jsonb;
begin
  if v_role is null then
    raise exception 'Akses ditolak' using errcode = '42501';
  end if;
  if v_role = 'petugas' then
    p_date := public.jakarta_today();
  end if;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.scanned_at desc), '[]'::jsonb)
  into v_result
  from (
    select l.id, l.scanned_at, l.status, l.student_nis,
           s.full_name as student_name, s.class_name,
           g.full_name as guardian_name, g.relationship,
           sc.full_name as scanner_name,
           l.substitute_name, l.substitute_status
    from public.pickup_logs l
    left join public.students s on s.nis = l.student_nis
    left join public.guardians g on g.id = l.guardian_id
    left join public.staff sc on sc.id = l.scanner_id
    where (p_date is null or l.pickup_date = p_date)
      and (p_status is null or l.status = p_status)
      and (p_class is null or s.class_name = p_class)
      and (p_q is null or s.full_name ilike '%' || p_q || '%' or s.nis ilike '%' || p_q || '%')
    order by l.scanned_at desc
    limit 500
  ) t;
  return v_result;
end;
$$;

revoke all on function public.list_pickup_logs(date, text, text, text) from public, anon;
grant execute on function public.list_pickup_logs(date, text, text, text) to authenticated;

-- private bucket for student photos
insert into storage.buckets (id, name, public) values ('student-photos', 'student-photos', false)
on conflict (id) do nothing;

create policy photos_read on storage.objects for select to authenticated
  using (bucket_id = 'student-photos' and public.current_staff_role() is not null);
create policy photos_admin_write on storage.objects for all to authenticated
  using (bucket_id = 'student-photos' and public.current_staff_role() = 'admin')
  with check (bucket_id = 'student-photos' and public.current_staff_role() = 'admin');
