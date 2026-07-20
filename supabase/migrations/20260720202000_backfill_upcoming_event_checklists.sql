-- Give upcoming active events the same checklist as newly created events.
-- Past events are intentionally left alone so historical work is not created
-- as a large overdue backlog.

insert into public.tasks (
  event_id,
  title,
  due,
  done,
  priority,
  source,
  template_key
)
select
  e.id,
  item.title,
  public.event_checklist_due(e.date, item.template_key),
  false,
  item.priority,
  'checklist',
  item.template_key
from public.events e
cross join (
  values
    ('confirm-details', 'Confirm venue and event details', 'high'),
    ('finalize-roster', 'Finalize participant roster', 'high'),
    ('send-contracts', 'Send outstanding contracts', 'high'),
    ('collect-forms', 'Collect required participant forms', 'high'),
    ('confirm-payments', 'Confirm participant payments', 'high'),
    ('send-brief', 'Send final event brief and arrival details', 'high'),
    ('event-check-in', 'Run event-day roster check-in', 'normal'),
    ('reconcile-wrap', 'Reconcile expenses and complete event', 'normal')
) as item(template_key, title, priority)
where e.date >= current_date
  and e.stage <> 'complete'
on conflict (event_id, template_key) do nothing;
