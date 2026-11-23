begin;
delete from public.pickup_logs; -- hermetic: rolled back at the end
select plan(7);

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p1@test.local');
insert into public.staff (id, full_name, role) values ('00000000-0000-0000-0000-0000000000a1', 'Petugas Satu', 'petugas');
insert into public.students (nis, full_name, class_name) values ('N001', 'Murid Harian', '3-A');
insert into public.guardians (id, student_nis, full_name, relationship, phone_number, qr_token_hash)
  values ('00000000-0000-0000-0000-0000000000b1', 'N001', 'Wali', 'Ibu', '081', encode(extensions.digest('tok-harian', 'sha256'), 'hex'));

-- picked up on Monday (yesterday relative to "today")
insert into public.pickup_logs (student_nis, guardian_id, scanner_id, status, pickup_date, scanned_at)
  values ('N001', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'verified',
          public.jakarta_today() - 1, now() - interval '1 day');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select is((public.check_pickup('tok-harian'))->>'status', 'ready', 'yesterday''s pickup does not block today');
select is((public.confirm_pickup('tok-harian'))->>'status', 'verified', 'the same QR verifies again today');
select is((public.confirm_pickup('tok-harian'))->>'status', 'duplicate', 'a second pickup on the same day is still a duplicate');

reset role;
select is((select count(*) from public.pickup_logs where student_nis = 'N001' and status = 'verified')::int, 2, 'both days are kept as history');
select is((select count(distinct pickup_date) from public.pickup_logs where student_nis = 'N001' and status = 'verified')::int, 2, 'on two different dates');

-- the petugas log screen only lists today
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is((select count(*) from jsonb_array_elements(public.list_pickup_logs()) e where e->>'status' = 'verified')::int, 1, 'petugas sees only today''s verified pickup');
select is((select count(*) from jsonb_array_elements(public.list_pickup_logs('2000-01-01')) e where e->>'status' = 'verified')::int, 1, 'a petugas cannot read other dates either (date forced to today)');

reset role;
select * from finish();
rollback;
