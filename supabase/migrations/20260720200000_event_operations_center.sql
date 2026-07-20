-- Event operations backbone: lifecycle, participant requirements, and
-- idempotent checklist tasks.

update public.events
set stage = case
  when status = 'wrapped' then 'complete'
  when status = 'confirmed' then 'booking'
  else 'planning'
end
where stage is null
   or stage not in ('planning', 'booking', 'finalizing', 'ready', 'complete');

alter table public.events
  alter column stage set default 'planning',
  alter column stage set not null;

alter table public.events
  drop constraint if exists events_stage_check;
alter table public.events
  add constraint events_stage_check
  check (stage in ('planning', 'booking', 'finalizing', 'ready', 'complete'));

alter table public.participants
  add column if not exists contract_required boolean not null default true,
  add column if not exists payment_required boolean not null default false,
  add column if not exists portal_required boolean not null default false;

update public.participants
set contract_required = false
where contract = 'na';

update public.participants
set payment_required = true
where rate > 0;

alter table public.tasks
  add column if not exists priority text not null default 'normal',
  add column if not exists source text not null default 'manual',
  add column if not exists template_key text;

alter table public.tasks
  drop constraint if exists tasks_priority_check;
alter table public.tasks
  add constraint tasks_priority_check
  check (priority in ('low', 'normal', 'high'));

alter table public.tasks
  drop constraint if exists tasks_source_check;
alter table public.tasks
  add constraint tasks_source_check
  check (source in ('manual', 'checklist', 'system'));

create unique index if not exists tasks_event_template_key_idx
  on public.tasks (event_id, template_key);

create index if not exists events_stage_date_idx
  on public.events (stage, date);

create index if not exists tasks_open_due_idx
  on public.tasks (done, due)
  where done = false;
