-- profiles, loan applications, RLS, and private helpers
-- Applied to the remote loan-agent project; kept here for the repo.

create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'customer',
  created_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('customer', 'admin'))
);

create table public.loan_applications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  loan_type text not null,
  amount numeric(14, 2) not null,
  monthly_income numeric(14, 2) not null,
  job_type text not null,
  existing_emi numeric(14, 2) not null default 0,
  status text not null default 'pending',
  risk_level text,
  risk_probability numeric(6, 5),
  jev_confidence numeric(6, 5),
  jev_model text,
  assessed_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loan_applications_loan_type_check check (loan_type in ('bike', 'vehicle', 'mobile')),
  constraint loan_applications_status_check check (status in ('pending', 'approved', 'rejected')),
  constraint loan_applications_risk_level_check check (risk_level is null or risk_level in ('low', 'medium', 'high')),
  constraint loan_applications_amount_check check (amount > 0),
  constraint loan_applications_income_check check (monthly_income > 0),
  constraint loan_applications_emi_check check (existing_emi >= 0)
);
