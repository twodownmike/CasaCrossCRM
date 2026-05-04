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
