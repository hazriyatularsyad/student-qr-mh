-- Schema for the school pickup system. See design doc "penjemputan-murid-qr".

create or replace function public.jakarta_today(ts timestamptz default now())
returns date
language sql
immutable
as $$ select (ts at time zone 'Asia/Jakarta')::date $$;

create table public.staff (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name varchar(120) not null,
  role varchar(20) not null check (role in ('petugas', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.students (
  nis varchar(32) primary key,
  full_name varchar(120) not null,
  nickname varchar(60),
  class_name varchar(30) not null,
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guardians (
  id uuid primary key default gen_random_uuid(),
  student_nis varchar(32) not null unique references public.students(nis) on delete cascade,
  full_name varchar(120) not null,
  relationship varchar(40) not null,
  phone_number varchar(25) not null,
  qr_token_hash varchar(64) not null unique,
  qr_issued_at timestamptz not null default now(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pickup_logs (
  id uuid primary key default gen_random_uuid(),
  student_nis varchar(32) references public.students(nis),
  guardian_id uuid references public.guardians(id),
  scanner_id uuid not null references public.staff(id),
  pickup_date date not null default public.jakarta_today(),
  scanned_at timestamptz not null default now(),
  status varchar(20) not null check (status in ('verified', 'duplicate', 'rejected')),
  notes text,
  device_info jsonb,
  substitute_name text,
  substitute_status text,
  constraint substitute_both_or_neither
    check ((substitute_name is null) = (substitute_status is null))
);

create unique index uniq_verified_pickup_per_day
  on public.pickup_logs (student_nis, pickup_date)
  where status = 'verified';

create index idx_pickup_logs_date_status
  on public.pickup_logs (pickup_date, status);
