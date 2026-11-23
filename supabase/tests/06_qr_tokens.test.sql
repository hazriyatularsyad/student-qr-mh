begin;
delete from public.pickup_logs;
delete from public.guardian_qr_tokens; -- hermetic: rolled back at the end
select plan(8);

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p1@test.local'),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adm@test.local');
insert into public.staff (id, full_name, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'Petugas Satu', 'petugas'),
  ('00000000-0000-0000-0000-0000000000a3', 'Admin', 'admin');
insert into public.students (nis, full_name, class_name) values ('T900', 'Murid Uji', '4-A');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
create temp table t_tok (tok text);
grant all on t_tok to authenticated;
insert into t_tok select public.issue_qr('T900', 'Wali Uji', 'Ibu', '0811');

select is((select count(*) from public.guardian_qr_tokens)::int, 1, 'issue_qr stores the token for admin');
select is((select token from public.guardian_qr_tokens), (select tok from t_tok), 'stored token equals the one returned');

insert into t_tok select public.issue_qr('T900', 'Wali Uji', 'Ibu', '0811');
select is((select count(*) from public.guardian_qr_tokens)::int, 1, 'reissue replaces the stored token');
select is((select token from public.guardian_qr_tokens), (select tok from t_tok offset 1 limit 1), 'stored token is the new one');

-- scanning still works from the hash
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is((public.check_pickup((select tok from t_tok offset 1 limit 1)))->>'status', 'ready', 'the stored token scans');
select is((select count(*) from public.guardian_qr_tokens)::int, 0, 'petugas cannot read stored tokens');

-- revoke removes the stored token
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
select public.revoke_qr('T900');
select is((select count(*) from public.guardian_qr_tokens)::int, 0, 'revoke removes the stored token');

-- import also stores tokens
create temp table t_imp (r jsonb);
grant all on t_imp to authenticated;
insert into t_imp select public.import_students('[{"nis":"T901","nama_murid":"Impor","panggilan":"","kelas":"1-A","nama_wali":"W","hubungan":"Ibu","no_hp":"1"}]'::jsonb);
select is((select token from public.guardian_qr_tokens), (select r->'issued'->0->>'token' from t_imp), 'import stores the issued token');

reset role;
select * from finish();
rollback;
