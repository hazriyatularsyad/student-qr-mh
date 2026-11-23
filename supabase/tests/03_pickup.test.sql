begin;
-- hermetic: ignore any logs already in the local database (rolled back at the end)
delete from public.pickup_logs;
select plan(18);

-- seed
insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p1@test.local'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p2@test.local'),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adm@test.local'),
  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'off@test.local');
insert into public.staff (id, full_name, role, is_active) values
  ('00000000-0000-0000-0000-0000000000a1', 'Petugas Satu', 'petugas', true),
  ('00000000-0000-0000-0000-0000000000a2', 'Petugas Dua', 'petugas', true),
  ('00000000-0000-0000-0000-0000000000a3', 'Admin', 'admin', true),
  ('00000000-0000-0000-0000-0000000000a4', 'Petugas Off', 'petugas', false);
insert into public.students (nis, full_name, nickname, class_name, is_active) values
  ('001', 'Aksa Pratama', 'Aksa', '3-A', true),
  ('002', 'Budi Santoso', null, '3-B', true),
  ('003', 'Citra', null, '2-A', true),
  ('004', 'Dani', null, '2-B', false),
  ('005', 'Eka', null, '1-A', true);
insert into public.guardians (id, student_nis, full_name, relationship, phone_number, qr_token_hash, is_active)
select ('00000000-0000-0000-0000-00000000000' || n)::uuid, '00' || n, 'Wali ' || n, 'Ibu', '08' || n,
       encode(extensions.digest('tok' || n, 'sha256'), 'hex'), n <> 3
from generate_series(1, 5) n;

-- 1-2: check is read-only when ready
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is((public.check_pickup('tok1'))->>'status', 'ready', 'valid token is ready');
select is((public.check_pickup('tok1'))->'guardian'->>'full_name', 'Wali 1', 'ready shows registered guardian');
reset role;
select is((select count(*) from public.pickup_logs)::int, 0, 'ready writes nothing');

-- 3-4: unknown token is rejected and logged
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is((public.check_pickup('nope'))->>'status', 'rejected', 'unknown token rejected');
reset role;
select is((select count(*) from public.pickup_logs where status = 'rejected' and student_nis is null and guardian_id is null)::int, 1, 'rejected attempt logged with NULLs');

-- 5-7: confirm then duplicate
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is((public.confirm_pickup('tok1'))->>'status', 'verified', 'confirm verifies');
select is((public.confirm_pickup('tok1'))->>'status', 'duplicate', 'second confirm is duplicate');
select is((public.check_pickup('tok1'))->>'previous_scanner_name', 'Petugas Satu', 'check after verified reports previous scanner');

-- 8: race — someone else verifies between check and confirm
select is((public.check_pickup('tok2'))->>'status', 'ready', 'student 2 ready');
reset role;
insert into public.pickup_logs (student_nis, guardian_id, scanner_id, status)
  values ('002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a2', 'verified');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is((public.confirm_pickup('tok2'))->>'status', 'duplicate', 'late confirm after other scanner is duplicate, not an error');

-- 9-10: inactive guardian / inactive student
select is((public.check_pickup('tok3'))->>'status', 'rejected', 'inactive guardian rejected');
select is((public.check_pickup('tok4'))->>'status', 'rejected', 'inactive student rejected');

-- 11-12: substitute rules
select is((public.confirm_pickup('tok5', 'Paman Joko', null))->>'status', 'rejected', 'substitute name without status rejected');
select is((public.confirm_pickup('tok5', 'Paman Joko', 'paman'))->>'status', 'verified', 'complete substitute verifies');
reset role;
select is((select substitute_status from public.pickup_logs where student_nis = '005' and status = 'verified'), 'paman', 'substitute stored');

-- 13: hash never leaks
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select ok(position(encode(extensions.digest('tok1', 'sha256'), 'hex') in (public.check_pickup('tok1'))::text) = 0, 'hash not in response');

-- 14-15: wrong staff
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
select throws_ok($$select public.check_pickup('tok1')$$, '42501', null, 'inactive petugas refused');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
select throws_ok($$select public.confirm_pickup('tok1')$$, '42501', null, 'admin cannot scan');

reset role;
select * from finish();
rollback;
