create table if not exists public.portal_users (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  email text not null,
  display_name text,
  active boolean not null default true,
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (person_id, email)
);

create index if not exists portal_users_email_idx
  on public.portal_users (lower(email))
  where active = true;

create index if not exists portal_users_person_idx
  on public.portal_users (person_id)
  where active = true;

drop trigger if exists portal_users_touch on public.portal_users;
create trigger portal_users_touch
  before update on public.portal_users
  for each row execute procedure public.touch_updated_at();

create or replace function public.portal_person_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select pu.person_id
  from public.portal_users pu
  where pu.active = true
    and lower(pu.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  order by pu.created_at asc
  limit 1;
$$;

revoke all on function public.portal_person_id() from public;
grant execute on function public.portal_person_id() to authenticated;

alter table public.portal_users enable row level security;

drop policy if exists "team portal users select" on public.portal_users;
create policy "team portal users select" on public.portal_users
  for select to authenticated using (public.is_team_member());

drop policy if exists "team portal users insert" on public.portal_users;
create policy "team portal users insert" on public.portal_users
  for insert to authenticated with check (public.is_team_member());

drop policy if exists "team portal users update" on public.portal_users;
create policy "team portal users update" on public.portal_users
  for update to authenticated using (public.is_team_member());

drop policy if exists "team portal users delete" on public.portal_users;
create policy "team portal users delete" on public.portal_users
  for delete to authenticated using (public.is_team_member());

drop policy if exists "portal users read self" on public.portal_users;
create policy "portal users read self" on public.portal_users
  for select to authenticated
  using (
    active = true
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "portal reads own person" on public.people;
create policy "portal reads own person" on public.people
  for select to authenticated
  using (id = public.portal_person_id());

drop policy if exists "portal reads own bookings" on public.participants;
create policy "portal reads own bookings" on public.participants
  for select to authenticated
  using (person_id = public.portal_person_id());

drop policy if exists "portal reads assigned events" on public.events;
create policy "portal reads assigned events" on public.events
  for select to authenticated
  using (
    exists (
      select 1
      from public.participants pp
      where pp.event_id = events.id
        and pp.person_id = public.portal_person_id()
    )
  );

drop policy if exists "portal reads own contracts" on public.contracts;
create policy "portal reads own contracts" on public.contracts
  for select to authenticated
  using (
    exists (
      select 1
      from public.participants pp
      where pp.id = contracts.participant_id
        and pp.person_id = public.portal_person_id()
    )
  );
