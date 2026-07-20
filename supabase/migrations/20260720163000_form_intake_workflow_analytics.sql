-- Intake workflow metadata and privacy-light form analytics.

alter table public.form_responses
  add column if not exists status text not null default 'new',
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists internal_notes text,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists updated_at timestamptz not null default now();

alter table public.form_responses
  drop constraint if exists form_responses_status_check;

alter table public.form_responses
  add constraint form_responses_status_check
  check (status in ('new', 'reviewing', 'follow_up', 'qualified', 'closed'));

drop trigger if exists form_responses_touch on public.form_responses;
create trigger form_responses_touch
  before update on public.form_responses
  for each row execute function public.touch_updated_at();

drop policy if exists "team updates responses" on public.form_responses;
create policy "team updates responses" on public.form_responses for update
  to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

drop policy if exists "anyone submits to published" on public.form_responses;
create policy "anyone submits to published" on public.form_responses
  for insert to anon, authenticated
  with check (
    status = 'new'
    and assigned_to is null
    and internal_notes is null
    and cardinality(tags) = 0
    and exists (
      select 1 from public.forms f
      where f.id = form_responses.form_id and f.is_published = true
    )
  );

create index if not exists form_responses_workflow_idx
  on public.form_responses (form_id, status, updated_at desc);

create table if not exists public.form_analytics_events (
  id bigint generated always as identity primary key,
  form_id uuid not null references public.forms(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'start')),
  session_id uuid not null,
  created_at timestamptz not null default now(),
  unique (form_id, event_type, session_id)
);

alter table public.form_analytics_events enable row level security;

drop policy if exists "team reads form analytics" on public.form_analytics_events;
create policy "team reads form analytics" on public.form_analytics_events
  for select to authenticated using (public.is_team_member());

create index if not exists form_analytics_events_form_created_idx
  on public.form_analytics_events (form_id, created_at desc);

create or replace function public.record_form_analytics_event(
  form_id_value uuid,
  event_type_value text,
  session_id_value uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if event_type_value not in ('view', 'start') then
    raise exception 'Unsupported analytics event';
  end if;

  if not exists (
    select 1 from public.forms
    where id = form_id_value and is_published = true
  ) then
    raise exception 'Form is not accepting analytics events';
  end if;

  insert into public.form_analytics_events (form_id, event_type, session_id)
  values (form_id_value, event_type_value, session_id_value)
  on conflict (form_id, event_type, session_id) do nothing;
end;
$$;

revoke all on function public.record_form_analytics_event(uuid, text, uuid) from public;
grant execute on function public.record_form_analytics_event(uuid, text, uuid)
  to anon, authenticated;

comment on table public.form_analytics_events is
  'Deduplicated form views and starts by anonymous per-form browser session. No IP address or response data is stored.';
