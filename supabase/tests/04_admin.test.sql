begin;
select plan(17);

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p1@test.local'),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adm@test.local');
insert into public.staff (id, full_name, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'Petugas Satu', 'petugas'),
  ('00000000-0000-0000-0000-0000000000a3', 'Admin', 'admin');
insert into public.students (nis, full_name, class_name) values ('900', 'Murid Sembilan', '4-A');

-- petugas is refused
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select throws_ok($$select public.issue_qr('900','W','Ibu','08')$$, '42501', null, 'petugas cannot issue_qr');
select throws_ok($$select public.import_students('[]'::jsonb)$$, '42501', null, 'petugas cannot import');
select throws_ok($$select public.revoke_qr('900')$$, '42501', null, 'petugas cannot revoke');

-- admin issues, reissues, revokes
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
create temp table t_tok (n int, tok text);
grant all on t_tok to authenticated;
insert into t_tok select 1, public.issue_qr('900', 'Wali Sembilan', 'Ibu', '0899');
insert into t_tok select 2, public.issue_qr('900', 'Wali Sembilan', 'Ibu', '0899');
select is((select length(tok) from t_tok where n = 1), 64, 'token is 64 hex chars');
select isnt((select tok from t_tok where n = 1), (select tok from t_tok where n = 2), 'reissue gives a new token');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is((public.check_pickup((select tok from t_tok where n = 1)))->>'status', 'rejected', 'old token is dead');
select is((public.check_pickup((select tok from t_tok where n = 2)))->>'status', 'ready', 'new token works');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
select public.revoke_qr('900');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is((public.check_pickup((select tok from t_tok where n = 2)))->>'status', 'rejected', 'revoked token is dead');

-- import
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
create temp table t_imp (r jsonb);
grant all on t_imp to authenticated;
insert into t_imp select public.import_students($$[
  {"nis":"00123","nama_murid":"Aksa Pratama","panggilan":"Aksa","kelas":"3-A","nama_wali":"Rina","hubungan":"Ibu","no_hp":"081"},
  {"nis":"00124","nama_murid":"Budi","panggilan":"","kelas":"3-B","nama_wali":"Dewi","hubungan":"Ibu","no_hp":"082"},
  {"nis":"00125","nama_murid":"Citra","panggilan":"","kelas":"2-A","nama_wali":"Sari","hubungan":"Ayah","no_hp":"083"}
]$$::jsonb);
select is((select jsonb_array_length(r->'issued') from t_imp), 3, 'import issues 3 cards');
select is((select (r->'issued'->0->>'nis') from t_imp), '00123', 'leading zeros preserved');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is((public.check_pickup((select r->'issued'->0->>'token' from t_imp)))->>'status', 'ready', 'imported token works');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
create temp table t_bad (r jsonb);
grant all on t_bad to authenticated;
insert into t_bad select public.import_students($$[
  {"nis":"00200","nama_murid":"Ok","panggilan":"","kelas":"1-A","nama_wali":"W","hubungan":"Ibu","no_hp":"1"},
  {"nis":"00201","nama_murid":"Tanpa Kelas","panggilan":"","kelas":"","nama_wali":"W","hubungan":"Ibu","no_hp":"2"}
]$$::jsonb);
select is((select (r->>'ok')::boolean from t_bad), false, 'bad import reports ok=false');
select is((select (r->'errors'->0->>'row')::int from t_bad), 2, 'error names the bad row');
select is((select count(*) from public.students where nis in ('00200', '00201'))::int, 0, 'nothing saved on failure');

-- re-import known NIS: update data, no new card
create temp table t_re (r jsonb);
grant all on t_re to authenticated;
insert into t_re select public.import_students($$[
  {"nis":"00123","nama_murid":"Aksa P. Baru","panggilan":"Aksa","kelas":"3-A","nama_wali":"Rina","hubungan":"Ibu","no_hp":"081"}
]$$::jsonb);
select is((select jsonb_array_length(r->'issued') from t_re), 0, 're-import issues no new card');
select is((select full_name from public.students where nis = '00123'), 'Aksa P. Baru', 're-import updates student');

select throws_ok($$select public.issue_qr('does-not-exist','W','Ibu','08')$$, 'P0002', null, 'unknown NIS raises');

reset role;
select * from finish();
rollback;
