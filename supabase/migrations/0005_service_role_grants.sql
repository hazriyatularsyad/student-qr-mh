-- The create-staff Edge Function inserts into staff with the service role;
-- this Supabase version does not grant table privileges automatically.
grant select, insert, update, delete on public.staff to service_role;
