alter table public.submissions
  add column if not exists future_projects_opt_in boolean not null default false;
