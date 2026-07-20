-- Seed the standard operations checklist for new events and keep unfinished
-- checklist due dates aligned when an event date changes.

create or replace function public.event_checklist_due(
  event_date date,
  checklist_key text
)
returns date
language sql
immutable
set search_path = public
as $$
  select event_date + case checklist_key
    when 'confirm-details' then -30
    when 'finalize-roster' then -21
    when 'send-contracts' then -14
    when 'collect-forms' then -7
    when 'confirm-payments' then -3
    when 'send-brief' then -2
    when 'event-check-in' then 0
    when 'reconcile-wrap' then 1
    else 0
  end
$$;

create or replace function public.seed_event_operations_checklist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tasks (
    event_id,
    title,
    due,
    done,
    priority,
    source,
    template_key
  )
  values
    (new.id, 'Confirm venue and event details', public.event_checklist_due(new.date, 'confirm-details'), false, 'high', 'checklist', 'confirm-details'),
    (new.id, 'Finalize participant roster', public.event_checklist_due(new.date, 'finalize-roster'), false, 'high', 'checklist', 'finalize-roster'),
    (new.id, 'Send outstanding contracts', public.event_checklist_due(new.date, 'send-contracts'), false, 'high', 'checklist', 'send-contracts'),
    (new.id, 'Collect required participant forms', public.event_checklist_due(new.date, 'collect-forms'), false, 'high', 'checklist', 'collect-forms'),
    (new.id, 'Confirm participant payments', public.event_checklist_due(new.date, 'confirm-payments'), false, 'high', 'checklist', 'confirm-payments'),
    (new.id, 'Send final event brief and arrival details', public.event_checklist_due(new.date, 'send-brief'), false, 'high', 'checklist', 'send-brief'),
    (new.id, 'Run event-day roster check-in', public.event_checklist_due(new.date, 'event-check-in'), false, 'normal', 'checklist', 'event-check-in'),
    (new.id, 'Reconcile expenses and complete event', public.event_checklist_due(new.date, 'reconcile-wrap'), false, 'normal', 'checklist', 'reconcile-wrap')
  on conflict (event_id, template_key) do nothing;
  return new;
end;
$$;

drop trigger if exists seed_event_operations_checklist_trg on public.events;
create trigger seed_event_operations_checklist_trg
  after insert on public.events
  for each row execute function public.seed_event_operations_checklist();

create or replace function public.rebase_event_operations_checklist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tasks
  set due = public.event_checklist_due(new.date, template_key)
  where event_id = new.id
    and source = 'checklist'
    and template_key is not null
    and done = false;
  return new;
end;
$$;

drop trigger if exists rebase_event_operations_checklist_trg on public.events;
create trigger rebase_event_operations_checklist_trg
  after update of date on public.events
  for each row
  when (old.date is distinct from new.date)
  execute function public.rebase_event_operations_checklist();
