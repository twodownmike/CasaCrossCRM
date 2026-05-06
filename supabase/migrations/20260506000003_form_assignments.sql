create table if not exists public.form_assignments (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  response_id uuid references public.form_responses(id) on delete set null,
  share_token text not null unique,
  sent_at timestamptz,
  completed_at timestamptz,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (form_id, participant_id)
);

alter table public.form_assignments enable row level security;

create index if not exists form_assignments_event_idx
  on public.form_assignments (event_id, created_at desc);

create index if not exists form_assignments_participant_idx
  on public.form_assignments (participant_id);

create index if not exists form_assignments_person_idx
  on public.form_assignments (person_id);

drop trigger if exists form_assignments_touch on public.form_assignments;
create trigger form_assignments_touch
  before update on public.form_assignments
  for each row execute function public.touch_updated_at();

drop policy if exists "team form assignments select" on public.form_assignments;
create policy "team form assignments select" on public.form_assignments
  for select to authenticated
  using ((select public.is_team_member()));

drop policy if exists "team form assignments insert" on public.form_assignments;
create policy "team form assignments insert" on public.form_assignments
  for insert to authenticated
  with check ((select public.is_team_member()));

drop policy if exists "team form assignments update" on public.form_assignments;
create policy "team form assignments update" on public.form_assignments
  for update to authenticated
  using ((select public.is_team_member()))
  with check ((select public.is_team_member()));

drop policy if exists "team form assignments delete" on public.form_assignments;
create policy "team form assignments delete" on public.form_assignments
  for delete to authenticated
  using ((select public.is_team_member()));

drop policy if exists "portal reads own form assignments" on public.form_assignments;
create policy "portal reads own form assignments" on public.form_assignments
  for select to authenticated
  using (person_id = (select public.portal_person_id()));

drop policy if exists "portal updates own form assignments" on public.form_assignments;
create policy "portal updates own form assignments" on public.form_assignments
  for update to authenticated
  using (person_id = (select public.portal_person_id()))
  with check (person_id = (select public.portal_person_id()));

create or replace function public.get_form_assignment_by_token(assignment_token text)
returns table (
  assignment_id uuid,
  form_id uuid,
  form_slug text,
  form_title text,
  form_description text,
  event_name text,
  event_date date,
  person_name text,
  completed_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    fa.id,
    f.id,
    f.slug,
    f.title,
    f.description,
    e.name,
    e.date,
    p.name,
    fa.completed_at
  from public.form_assignments fa
  join public.forms f on f.id = fa.form_id
  join public.events e on e.id = fa.event_id
  join public.people p on p.id = fa.person_id
  where fa.share_token = assignment_token
    and f.is_published = true
  limit 1
$$;

create or replace function public.complete_form_assignment(
  assignment_token text,
  response_id_value uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.form_assignments
  set response_id = response_id_value,
      completed_at = now()
  where share_token = assignment_token
    and completed_at is null;
end;
$$;
