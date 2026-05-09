create or replace function public.mark_contract_opened(token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.contracts%rowtype;
begin
  select * into rec
    from public.contracts
   where share_token = token
     and status in ('sent', 'draft')
   for update;

  if not found then
    return jsonb_build_object('ok', false);
  end if;

  update public.contracts
     set opened_at = coalesce(opened_at, now())
   where id = rec.id;

  if rec.status = 'sent' then
    update public.participants
       set contract = 'opened'
     where id = rec.participant_id
       and contract = 'sent';
  end if;

  return jsonb_build_object('ok', true, 'id', rec.id);
end;
$$;

revoke all on function public.mark_contract_opened(text) from public;
grant execute on function public.mark_contract_opened(text) to anon, authenticated;

create or replace function public.sign_contract(
  token text,
  signer_name text,
  signature_url_in text,
  signer_ip_in text,
  signer_ua_in text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.contracts%rowtype;
begin
  select * into rec
    from public.contracts
   where share_token = token
     and status in ('sent', 'draft')
   for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Already signed or invalid link.');
  end if;

  update public.contracts set
    status      = 'signed',
    opened_at   = coalesce(opened_at, now()),
    signed_at   = now(),
    sent_at     = coalesce(sent_at, now()),
    signed_name = signer_name,
    signature_url = signature_url_in,
    signer_ip   = signer_ip_in,
    signer_ua   = signer_ua_in
  where id = rec.id;

  update public.participants
    set contract = 'signed'
   where id = rec.participant_id;

  return jsonb_build_object('ok', true, 'id', rec.id);
end;
$$;

revoke all on function public.sign_contract(text, text, text, text, text) from public;
grant execute on function public.sign_contract(text, text, text, text, text) to anon, authenticated;

-- Re-emit the public RPC so /sign/[token] and portal views can read opened_at.
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
    'opened_at', c.opened_at,
    'signed_at', c.signed_at,
    'signature_url', c.signature_url,
    'signed_name', c.signed_name,
    'event_name', e.name,
    'event_date', e.date,
    'event_location', e.location,
    'recipient_name',
      coalesce(p.preferred_name, p.legal_name, p.name),
    'payment_required', c.payment_required,
    'payment_amount', c.payment_amount,
    'studio_venmo_url', (
      select venmo_url from public.studio_settings where id = 1
    ),
    'studio_name', (
      select studio_name from public.studio_settings where id = 1
    )
  )
  from public.contracts c
  join public.events e on e.id = c.event_id
  join public.participants pp on pp.id = c.participant_id
  join public.people p on p.id = pp.person_id
  where c.share_token = token
  limit 1;
$$;
