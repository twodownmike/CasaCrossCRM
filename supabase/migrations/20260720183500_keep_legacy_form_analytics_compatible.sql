-- Keep the currently deployed analytics caller working while the v2 client rolls out.
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
  on conflict do nothing;
end;
$$;
