begin;
-- hermetic: ignore any logs already in the local database (rolled back at the end)
delete from public.pickup_logs;
select plan(10);

-- seed as superuser
insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p1@test.local'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adm@test.local'),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'off@test.local');
insert into public.staff (id, full_name, role, is_active) values
  ('00000000-0000-0000-0000-0000000000a1', 'Petugas Satu', 'petugas', true),
  ('00000000-0000-0000-0000-0000000000a2', 'Admin', 'admin', true),
  ('00000000-0000-0000-0000-0000000000a3', 'Petugas Off', 'petugas', false);
insert into public.students (nis, full_name, class_name) values ('001', 'Aksa Pratama', '3-A'), ('002', 'Budi', '3-B');
insert into public.guardians (id, student_nis, full_name, relationship, phone_number, qr_token_hash) values
  ('00000000-0000-0000-0000-0000000000b1', '001', 'Rina', 'Ibu', '081', repeat('a', 64)),
  ('00000000-0000-0000-0000-0000000000b2', '002', 'Dewi', 'Ibu', '082', repeat('b', 64));
insert into public.pickup_logs (student_nis, guardian_id, scanner_id, status, pickup_date) values
  ('001', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'verified', '2020-01-01'),
  ('001', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'verified', public.jakarta_today());

-- petugas
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select is(public.current_staff_role(), 'petugas', 'petugas role resolved');
select is((select count(*) from public.guardians)::int, 0, 'petugas cannot read guardians');
select throws_ok($$insert into public.students (nis, full_name, class_name) values ('999','X','1-A')$$, '42501', null, 'petugas cannot insert students');
select is(jsonb_array_length(public.list_pickup_logs('2020-01-01')), 1, 'petugas date is forced to today');
select is(jsonb_array_length(public.list_pickup_logs(null, null, null, 'Aksa')), 1, 'search by name works');

-- admin
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select is(jsonb_array_length(public.list_pickup_logs('2020-01-01')), 1, 'admin can read an old date');
select lives_ok($$insert into public.students (nis, full_name, class_name) values ('999','X','1-A')$$, 'admin can insert students');

-- inactive staff
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
select is(public.current_staff_role(), null, 'inactive staff has no role');
select throws_ok($$select public.list_pickup_logs()$$, '42501', null, 'inactive staff is refused');

-- anon
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select public.list_pickup_logs()$$, '42501', null, 'anon is refused');

reset role;
select * from finish();
rollback;
