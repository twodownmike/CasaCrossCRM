-- ─── Bundled migration: run this in Supabase SQL editor ───
-- Combines the legal/preferred name columns + e-sign tables + PDF template support.
-- Idempotent: safe to run more than once.

-- ─── Legal + preferred names ───
-- Capture both the legal name (for contracts/payments) and the
-- preferred name (display) for submissions and people.

alter table public.submissions
  add column if not exists legal_name text,
  add column if not exists preferred_name text;

alter table public.people
  add column if not exists legal_name text,
  add column if not exists preferred_name text;

-- ─── Native e-sign (templates, contracts, RPCs) ───
-- Native e-sign MVP.
-- contract_templates = reusable boilerplate with {{merge_fields}}.
-- contracts = the rendered, frozen instance attached to a participant,
--   with a share_token used as the only credential needed to view+sign.
-- Anon access is granted via SECURITY DEFINER RPCs so the contract
-- table itself stays gated to team members.

do $$ begin
  create type contract_doc_status as enum ('draft','sent','signed','void');
exception when duplicate_object then null; end $$;

create table if not exists public.contract_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  body_md text not null default '',
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists contract_templates_touch on public.contract_templates;
create trigger contract_templates_touch
  before update on public.contract_templates
  for each row execute procedure public.touch_updated_at();

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  participant_id uuid not null references public.participants on delete cascade,
  template_id uuid references public.contract_templates on delete set null,
  title text not null,
  body_md text not null,
  status contract_doc_status not null default 'draft',
  share_token text not null unique,
  sent_at timestamptz,
  signed_at timestamptz,
  signature_url text,
  signed_name text,
  signer_ip text,
  signer_ua text,
  created_by uuid references auth.users,
  created_at timestamptz not null default now()
);

alter table public.contract_templates enable row level security;
alter table public.contracts enable row level security;

-- Templates: team-only
drop policy if exists "team templates select" on public.contract_templates;
create policy "team templates select" on public.contract_templates
  for select to authenticated using (public.is_team_member());
drop policy if exists "team templates insert" on public.contract_templates;
create policy "team templates insert" on public.contract_templates
  for insert to authenticated with check (public.is_team_member());
drop policy if exists "team templates update" on public.contract_templates;
create policy "team templates update" on public.contract_templates
  for update to authenticated using (public.is_team_member());
drop policy if exists "team templates delete" on public.contract_templates;
create policy "team templates delete" on public.contract_templates
  for delete to authenticated using (public.is_team_member());

-- Contracts: team only direct access. Anon goes through RPCs.
drop policy if exists "team contracts select" on public.contracts;
create policy "team contracts select" on public.contracts
  for select to authenticated using (public.is_team_member());
drop policy if exists "team contracts insert" on public.contracts;
create policy "team contracts insert" on public.contracts
  for insert to authenticated with check (public.is_team_member());
drop policy if exists "team contracts update" on public.contracts;
create policy "team contracts update" on public.contracts
  for update to authenticated using (public.is_team_member());
drop policy if exists "team contracts delete" on public.contracts;
create policy "team contracts delete" on public.contracts
  for delete to authenticated using (public.is_team_member());

-- Public RPCs
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

revoke all on function public.get_contract_by_token(text) from public;
grant execute on function public.get_contract_by_token(text) to anon, authenticated;

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
    signed_at   = now(),
    sent_at     = coalesce(sent_at, now()),
    signed_name = signer_name,
    signature_url = signature_url_in,
    signer_ip   = signer_ip_in,
    signer_ua   = signer_ua_in
  where id = rec.id;

  -- Flip the participant's contract enum so the rest of the app knows.
  update public.participants
    set contract = 'signed'
   where id = rec.participant_id;

  return jsonb_build_object('ok', true, 'id', rec.id);
end;
$$;

revoke all on function public.sign_contract(text, text, text, text, text) from public;
grant execute on function public.sign_contract(text, text, text, text, text) to anon, authenticated;

create index if not exists contracts_event_idx on public.contracts (event_id);
create index if not exists contracts_participant_idx on public.contracts (participant_id);
create index if not exists contracts_token_idx on public.contracts (share_token);

-- ─── PDF template support ───
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

notify pgrst, 'reload schema';
