-- Public intake form submissions.
-- Anyone (including unauthenticated visitors) can submit. Only team
-- members can read, approve, or archive.

do $$ begin
  create type submission_status as enum ('pending','approved','archived');
exception when duplicate_object then null; end $$;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  role role_kind not null,
  name text not null,
  email text,
  phone text,
  instagram text,
  location text,
  specialty text,
  portfolio_url text,
  message text,
  status submission_status not null default 'pending',
  reviewed_by uuid references auth.users,
  reviewed_at timestamptz,
  converted_person_id uuid references public.people on delete set null,
  created_at timestamptz not null default now()
);

alter table public.submissions enable row level security;

drop policy if exists "anyone can submit" on public.submissions;
create policy "anyone can submit"
  on public.submissions for insert
  to anon, authenticated
  with check (true);

drop policy if exists "team reads submissions" on public.submissions;
create policy "team reads submissions"
  on public.submissions for select
  to authenticated
  using (public.is_team_member());

drop policy if exists "team updates submissions" on public.submissions;
create policy "team updates submissions"
  on public.submissions for update
  to authenticated
  using (public.is_team_member());

drop policy if exists "team deletes submissions" on public.submissions;
create policy "team deletes submissions"
  on public.submissions for delete
  to authenticated
  using (public.is_team_member());

create index if not exists submissions_status_idx
  on public.submissions (status, created_at desc);
