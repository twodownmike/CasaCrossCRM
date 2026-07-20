-- Step-level form analytics, completion timing, attribution, and private uploads.

alter table public.form_analytics_events
  add column if not exists step_index int,
  add column if not exists source text,
  add column if not exists medium text,
  add column if not exists campaign text,
  add column if not exists referrer_host text;

alter table public.form_analytics_events
  drop constraint if exists form_analytics_events_event_type_check;
alter table public.form_analytics_events
  add constraint form_analytics_events_event_type_check
  check (event_type in ('view', 'start', 'step'));

alter table public.form_analytics_events
  drop constraint if exists form_analytics_events_form_id_event_type_session_id_key;
create unique index if not exists form_analytics_event_once_idx
  on public.form_analytics_events (form_id, event_type, session_id)
  where step_index is null;
create unique index if not exists form_analytics_step_once_idx
  on public.form_analytics_events (form_id, event_type, session_id, step_index)
  where step_index is not null;

alter table public.form_responses
  add column if not exists analytics_session_id uuid,
  add column if not exists completion_seconds int;
create index if not exists form_responses_analytics_session_idx
  on public.form_responses (form_id, analytics_session_id)
  where analytics_session_id is not null;

create or replace function public.set_form_response_completion_time()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  started_at timestamptz;
begin
  if new.analytics_session_id is null then return new; end if;
  select min(created_at) into started_at
  from public.form_analytics_events
  where form_id = new.form_id
    and session_id = new.analytics_session_id
    and event_type = 'start';
  if started_at is not null then
    new.completion_seconds := greatest(
      0,
      extract(epoch from (now() - started_at))::int
    );
  end if;
  return new;
end;
$$;

drop trigger if exists form_response_completion_time on public.form_responses;
create trigger form_response_completion_time
  before insert on public.form_responses
  for each row execute function public.set_form_response_completion_time();

create or replace function public.record_form_analytics_event_v2(
  form_id_value uuid,
  event_type_value text,
  session_id_value uuid,
  step_index_value int default null,
  source_value text default null,
  medium_value text default null,
  campaign_value text default null,
  referrer_host_value text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if event_type_value not in ('view', 'start', 'step') then
    raise exception 'Unsupported analytics event';
  end if;
  if event_type_value = 'step'
    and (step_index_value is null or step_index_value < 0 or step_index_value > 100) then
    raise exception 'Invalid form step';
  end if;
  if event_type_value <> 'step' then step_index_value := null; end if;
  if not exists (
    select 1 from public.forms
    where id = form_id_value and is_published = true
  ) then
    raise exception 'Form is not accepting analytics events';
  end if;

  insert into public.form_analytics_events (
    form_id, event_type, session_id, step_index,
    source, medium, campaign, referrer_host
  ) values (
    form_id_value, event_type_value, session_id_value, step_index_value,
    nullif(left(trim(source_value), 100), ''),
    nullif(left(trim(medium_value), 100), ''),
    nullif(left(trim(campaign_value), 160), ''),
    nullif(left(lower(trim(referrer_host_value)), 180), '')
  )
  on conflict do nothing;
end;
$$;

revoke all on function public.record_form_analytics_event_v2(
  uuid, text, uuid, int, text, text, text, text
) from public;
grant execute on function public.record_form_analytics_event_v2(
  uuid, text, uuid, int, text, text, text, text
) to anon, authenticated;

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'form-uploads', 'form-uploads', false, 10485760,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'application/pdf'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "published forms accept private uploads" on storage.objects;
create policy "published forms accept private uploads"
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'form-uploads'
    and exists (
      select 1
      from public.forms f
      join public.form_fields ff on ff.form_id = f.id
      where f.is_published = true
        and ff.type = 'file'
        and f.id::text = (storage.foldername(name))[1]
        and ff.id::text = (storage.foldername(name))[2]
    )
  );

drop policy if exists "team reads private form uploads" on storage.objects;
create policy "team reads private form uploads"
  on storage.objects for select to authenticated
  using (bucket_id = 'form-uploads' and public.is_team_member());

drop policy if exists "team deletes private form uploads" on storage.objects;
create policy "team deletes private form uploads"
  on storage.objects for delete to authenticated
  using (bucket_id = 'form-uploads' and public.is_team_member());

comment on column public.form_analytics_events.referrer_host is
  'Hostname only; complete referrer URLs are intentionally not retained.';
comment on column public.form_responses.completion_seconds is
  'Elapsed seconds from the first tracked input change to successful submission.';
