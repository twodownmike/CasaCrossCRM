alter table public.contracts
  add column if not exists show_event_date boolean not null default true;

create or replace function public.get_contract_by_token(token text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'id', c.id,
    'kind', c.kind,
    'title', c.title,
    'body_md', c.body_md,
    'pdf_url', c.pdf_url,
    'status', c.status,
    'sent_at', c.sent_at,
    'opened_at', c.opened_at,
    'signed_at', c.signed_at,
    'signature_url', c.signature_url,
    'signed_name', c.signed_name,
    'event_name', e.name,
    'event_date', case when c.show_event_date then e.date else null end,
    'show_event_date', c.show_event_date,
    'event_location', e.location,
    'recipient_name',
      coalesce(p.preferred_name, p.legal_name, p.name),
    'payment_required', c.payment_required,
    'payment_amount', c.payment_amount,
    'signature_count', (
      select count(*) from public.contract_signatures cs
       where cs.contract_id = c.id
    ),
    'studio_venmo_url', (
      select venmo_url from public.studio_settings where id = 1
    ),
    'studio_name', (
      select studio_name from public.studio_settings where id = 1
    )
  )
  from public.contracts c
  join public.events e on e.id = c.event_id
  left join public.participants pp on pp.id = c.participant_id
  left join public.people p on p.id = pp.person_id
  where c.share_token = token
  limit 1;
$$;

revoke all on function public.get_contract_by_token(text) from public;
grant execute on function public.get_contract_by_token(text) to anon, authenticated;
