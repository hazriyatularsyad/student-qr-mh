begin;
select plan(7);

select is(public.jakarta_today('2026-11-23 17:30:00+00'), '2026-11-24'::date, '00:30 WIB counts as the next Jakarta day');
select is(public.jakarta_today('2026-11-23 16:59:00+00'), '2026-11-23'::date, '23:59 WIB is still the same Jakarta day');

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p1@test.local');
insert into public.staff (id, full_name, role) values ('00000000-0000-0000-0000-0000000000a1', 'Petugas Satu', 'petugas');
insert into public.students (nis, full_name, class_name) values ('001', 'Aksa Pratama', '3-A'), ('002', 'Budi', '3-B');
insert into public.guardians (id, student_nis, full_name, relationship, phone_number, qr_token_hash)
  values ('00000000-0000-0000-0000-0000000000b1', '001', 'Rina', 'Ibu', '081', repeat('a', 64));

select throws_ok(
  $$insert into public.guardians (student_nis, full_name, relationship, phone_number, qr_token_hash)
    values ('001', 'Lain', 'Ayah', '082', repeat('b', 64))$$,
  '23505', null, 'one guardian per student');

insert into public.pickup_logs (student_nis, guardian_id, scanner_id, status, pickup_date)
  values ('001', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'verified', '2026-11-23');

select throws_ok(
  $$insert into public.pickup_logs (student_nis, guardian_id, scanner_id, status, pickup_date)
    values ('001', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'verified', '2026-11-23')$$,
  '23505', null, 'second verified pickup same day is rejected by index');

select lives_ok(
  $$insert into public.pickup_logs (scanner_id, status)
    values ('00000000-0000-0000-0000-0000000000a1', 'rejected')$$,
  'rejected log may have NULL student and guardian');

select lives_ok(
  $$insert into public.pickup_logs (student_nis, guardian_id, scanner_id, status, pickup_date, substitute_name, substitute_status)
    values ('001', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'duplicate', '2026-11-23', 'Paman Joko', 'paman')$$,
  'duplicate rows may repeat and carry substitute info');

select throws_ok(
  $$insert into public.pickup_logs (student_nis, guardian_id, scanner_id, status, pickup_date, substitute_name)
    values ('002', null, '00000000-0000-0000-0000-0000000000a1', 'rejected', '2026-11-23', 'Tanpa status')$$,
  '23514', null, 'substitute_name without substitute_status violates check');

select * from finish();
rollback;
