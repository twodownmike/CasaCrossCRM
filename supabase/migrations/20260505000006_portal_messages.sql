create table if not exists public.portal_messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  sender_kind text not null check (sender_kind in ('portal', 'team')),
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_name text,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.portal_messages enable row level security;

create index if not exists portal_messages_event_person_idx
  on public.portal_messages (event_id, person_id, created_at);

drop policy if exists "team portal messages select" on public.portal_messages;
create policy "team portal messages select" on public.portal_messages
  for select to authenticated using (public.is_team_member());

drop policy if exists "team portal messages insert" on public.portal_messages;
create policy "team portal messages insert" on public.portal_messages
  for insert to authenticated
  with check (
    public.is_team_member()
    and sender_kind = 'team'
    and exists (
      select 1
      from public.participants pp
      where pp.event_id = portal_messages.event_id
        and pp.person_id = portal_messages.person_id
    )
  );

drop policy if exists "portal reads own messages" on public.portal_messages;
create policy "portal reads own messages" on public.portal_messages
  for select to authenticated
  using (
    person_id = public.portal_person_id()
    and exists (
      select 1
      from public.participants pp
      where pp.event_id = portal_messages.event_id
        and pp.person_id = public.portal_person_id()
    )
  );

drop policy if exists "portal sends own messages" on public.portal_messages;
create policy "portal sends own messages" on public.portal_messages
  for insert to authenticated
  with check (
    sender_kind = 'portal'
    and person_id = public.portal_person_id()
    and exists (
      select 1
      from public.participants pp
      where pp.event_id = portal_messages.event_id
        and pp.person_id = public.portal_person_id()
    )
  );
