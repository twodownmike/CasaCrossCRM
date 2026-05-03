-- Capture both the legal name (for contracts/payments) and the
-- preferred name (display) for submissions and people.

alter table public.submissions
  add column if not exists legal_name text,
  add column if not exists preferred_name text;

alter table public.people
  add column if not exists legal_name text,
  add column if not exists preferred_name text;
