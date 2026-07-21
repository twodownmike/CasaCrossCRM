-- Shared intake ownership, follow-up, source, priority, and outcome fields.

alter table public.submissions
  add column if not exists owner_id uuid references auth.users(id) on delete set null,
  add column if not exists follow_up_at timestamptz,
  add column if not exists priority text not null default 'normal',
  add column if not exists source text not null default 'Website application',
  add column if not exists outcome text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.submissions
  drop constraint if exists submissions_priority_check;

alter table public.submissions
  add constraint submissions_priority_check
  check (priority in ('low', 'normal', 'high', 'urgent'));

update public.submissions
set owner_id = reviewed_by
where owner_id is null and reviewed_by is not null;

drop trigger if exists submissions_touch on public.submissions;
create trigger submissions_touch
  before update on public.submissions
  for each row execute function public.touch_updated_at();

drop policy if exists "anyone can submit" on public.submissions;
create policy "anyone can submit"
  on public.submissions for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and converted_person_id is null
    and owner_id is null
    and follow_up_at is null
    and priority = 'normal'
    and source = 'Website application'
    and outcome is null
  );

create index if not exists submissions_follow_up_idx
  on public.submissions (status, follow_up_at, priority);

alter table public.form_responses
  add column if not exists follow_up_at timestamptz,
  add column if not exists priority text not null default 'normal',
  add column if not exists source text not null default 'Shared form',
  add column if not exists outcome text;

alter table public.form_responses
  drop constraint if exists form_responses_priority_check;

alter table public.form_responses
  add constraint form_responses_priority_check
  check (priority in ('low', 'normal', 'high', 'urgent'));

drop policy if exists "anyone submits to published" on public.form_responses;
create policy "anyone submits to published" on public.form_responses
  for insert to anon, authenticated
  with check (
    status = 'new'
    and assigned_to is null
    and internal_notes is null
    and cardinality(tags) = 0
    and follow_up_at is null
    and priority = 'normal'
    and source = 'Shared form'
    and outcome is null
    and exists (
      select 1 from public.forms f
      where f.id = form_responses.form_id and f.is_published = true
    )
  );

create index if not exists form_responses_follow_up_idx
  on public.form_responses (form_id, status, follow_up_at, priority);
