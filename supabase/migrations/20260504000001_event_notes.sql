-- Internal notes attached to an event (separate from the person notes table).

create table if not exists public.event_notes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users
);

alter table public.event_notes enable row level security;

drop policy if exists "team event_notes select" on public.event_notes;
create policy "team event_notes select" on public.event_notes for select
  to authenticated using (public.is_team_member());

drop policy if exists "team event_notes insert" on public.event_notes;
create policy "team event_notes insert" on public.event_notes for insert
  to authenticated with check (public.is_team_member());

drop policy if exists "team event_notes delete" on public.event_notes;
create policy "team event_notes delete" on public.event_notes for delete
  to authenticated using (public.is_team_member());

create index if not exists event_notes_event_idx
  on public.event_notes (event_id, created_at desc);
