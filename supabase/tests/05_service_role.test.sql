begin;
select plan(1);

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'svc@test.local');

set local role service_role;
select lives_ok(
  $$insert into public.staff (id, full_name, role) values ('00000000-0000-0000-0000-0000000000c1', 'Via Edge Function', 'petugas')$$,
  'service_role (create-staff edge function) can insert staff');

reset role;
select * from finish();
rollback;
