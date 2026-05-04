-- ─── Bundle: payment-after-sign + expenses ───
-- Run these if your contract sign page isn't showing the Pay panel,
-- and to enable the new Expenses tab on each event.
-- Idempotent — safe to re-run if some pieces already exist.

-- Optional Venmo payment landing after a contract is signed.
-- studio_settings.venmo_url is the studio's Venmo profile URL.
-- contracts.payment_required + payment_amount are per-contract overrides
-- captured at send time (so changing a vendor's rate later doesn't
-- alter the amount on a contract that's already been sent).

alter table public.studio_settings
  add column if not exists venmo_url text;

alter table public.contracts
  add column if not exists payment_required boolean not null default false,
  add column if not exists payment_amount numeric(10,2);

-- Re-emit the public RPC so /sign/[token] sees the new fields + studio Venmo.
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

-- Per-event expense tracking. Pairs with participants.paid (revenue) to
-- give a real per-event P&L on the Money tab.

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  description text not null,
  category text,
  amount numeric(10,2) not null default 0,
  vendor_id uuid references public.people on delete set null,
  vendor_name text,
  spent_at date,
  notes text,
  receipt_url text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users
);

alter table public.expenses enable row level security;

drop policy if exists "team expenses select" on public.expenses;
create policy "team expenses select" on public.expenses for select
  to authenticated using (public.is_team_member());
drop policy if exists "team expenses insert" on public.expenses;
create policy "team expenses insert" on public.expenses for insert
  to authenticated with check (public.is_team_member());
drop policy if exists "team expenses update" on public.expenses;
create policy "team expenses update" on public.expenses for update
  to authenticated using (public.is_team_member());
drop policy if exists "team expenses delete" on public.expenses;
create policy "team expenses delete" on public.expenses for delete
  to authenticated using (public.is_team_member());

create index if not exists expenses_event_idx
  on public.expenses (event_id, spent_at desc);

notify pgrst, 'reload schema';
