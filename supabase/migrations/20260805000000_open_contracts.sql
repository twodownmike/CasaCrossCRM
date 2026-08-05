-- Shared "open" contracts: one link, many signers.
-- contracts.kind distinguishes the classic per-participant contract
-- ('individual') from an open contract ('open') that is tied to an event
-- but not to any participant. Each signer on an open contract types their
-- own name + email and lands as a row in contract_signatures; the contract
-- itself stays 'sent' so the same link keeps working for everyone.

alter table public.contracts
  add column if not exists kind text not null default 'individual';

do $$ begin
  alter table public.contracts
    add constraint contracts_kind_check
    check (kind in ('individual', 'open'));
exception when duplicate_object then null; end $$;

alter table public.contracts
  alter column participant_id drop not null;

-- Individual contracts must still have their participant.
do $$ begin
  alter table public.contracts
    add constraint contracts_participant_kind_check
    check (kind = 'open' or participant_id is not null);
exception when duplicate_object then null; end $$;

create table if not exists public.contract_signatures (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts on delete cascade,
  signed_name text not null,
  signer_email text,
  signature_url text not null,
  signer_ip text,
  signer_ua text,
  signed_at timestamptz not null default now()
);

create index if not exists contract_signatures_contract_idx
  on public.contract_signatures (contract_id);

alter table public.contract_signatures enable row level security;

-- Team-only direct access; anon signs through the SECURITY DEFINER RPC.
drop policy if exists "team contract signatures select" on public.contract_signatures;
create policy "team contract signatures select" on public.contract_signatures
  for select to authenticated using (public.is_team_member());
drop policy if exists "team contract signatures delete" on public.contract_signatures;
create policy "team contract signatures delete" on public.contract_signatures
  for delete to authenticated using (public.is_team_member());

-- ─── Public RPCs ───

-- Re-emit with left joins (open contracts have no participant),
-- plus kind + signature_count.
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
    'event_date', e.date,
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

-- Guard the single-signer RPC so it can't consume an open contract.
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
     and kind = 'individual'
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

-- Append a signature to an open contract. The contract never flips to
-- 'signed' — it stays 'sent' until the team voids or recalls it.
create or replace function public.sign_open_contract(
  token text,
  signer_name text,
  signer_email_in text,
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
  sig_id uuid;
begin
  select * into rec
    from public.contracts
   where share_token = token
     and kind = 'open'
     and status = 'sent'
   for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'This link is no longer open for signatures.');
  end if;

  if signer_email_in is not null and signer_email_in <> '' then
    if exists (
      select 1 from public.contract_signatures
       where contract_id = rec.id
         and lower(signer_email) = lower(signer_email_in)
    ) then
      return jsonb_build_object('ok', false, 'error', 'This email address has already signed this agreement.');
    end if;
  end if;

  insert into public.contract_signatures
    (contract_id, signed_name, signer_email, signature_url, signer_ip, signer_ua)
  values
    (rec.id, signer_name, nullif(signer_email_in, ''), signature_url_in, signer_ip_in, signer_ua_in)
  returning id into sig_id;

  update public.contracts
     set opened_at = coalesce(opened_at, now())
   where id = rec.id;

  return jsonb_build_object('ok', true, 'id', rec.id, 'signature_id', sig_id);
end;
$$;

revoke all on function public.sign_open_contract(text, text, text, text, text, text) from public;
grant execute on function public.sign_open_contract(text, text, text, text, text, text) to anon, authenticated;
