-- Allow contract templates to be PDF-based instead of markdown-only.
-- PDF URL is stored on the template, copied (frozen) onto the contract
-- at send time so swapping the template later doesn't change signed
-- documents.

alter table public.contract_templates
  add column if not exists pdf_url text;

alter table public.contracts
  add column if not exists pdf_url text;

-- Re-emit the public RPC so /sign/[token] can read pdf_url too.
create or replace function public.get_contract_by_token(token text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'id', c.id,
    'title', c.title,
    'body_md', c.body_md,
    'pdf_url', c.pdf_url,
    'status', c.status,
    'sent_at', c.sent_at,
    'signed_at', c.signed_at,
    'signature_url', c.signature_url,
    'signed_name', c.signed_name,
    'event_name', e.name,
    'event_date', e.date,
    'event_location', e.location,
    'recipient_name',
      coalesce(p.preferred_name, p.legal_name, p.name)
  )
  from public.contracts c
  join public.events e on e.id = c.event_id
  join public.participants pp on pp.id = c.participant_id
  join public.people p on p.id = pp.person_id
  where c.share_token = token
  limit 1;
$$;
