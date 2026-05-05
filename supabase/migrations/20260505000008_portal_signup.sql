-- Portal invite/signup flow and first-time setup fields.

alter table public.portal_users
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text,
  add column if not exists communication_opt_in boolean not null default false,
  add column if not exists setup_completed_at timestamptz;

create table if not exists public.portal_invites (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  email text not null,
  token text not null unique,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  created_by uuid references auth.users,
  created_at timestamptz not null default now()
);

create index if not exists portal_invites_token_idx
  on public.portal_invites (token);

create index if not exists portal_invites_person_idx
  on public.portal_invites (person_id, created_at desc);

alter table public.portal_invites enable row level security;

drop policy if exists "team portal invites select" on public.portal_invites;
create policy "team portal invites select"
  on public.portal_invites for select to authenticated
  using (public.is_team_member());

drop policy if exists "team portal invites insert" on public.portal_invites;
create policy "team portal invites insert"
  on public.portal_invites for insert to authenticated
  with check (public.is_team_member());

drop policy if exists "team portal invites update" on public.portal_invites;
create policy "team portal invites update"
  on public.portal_invites for update to authenticated
  using (public.is_team_member());

drop policy if exists "anyone can read active portal invite by token" on public.portal_invites;

create or replace function public.get_portal_invite(invite_token text)
returns table(email text, expires_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select pi.email, pi.expires_at
  from public.portal_invites pi
  where pi.token = invite_token
    and pi.accepted_at is null
    and pi.expires_at > now()
  limit 1;
$$;

revoke all on function public.get_portal_invite(text) from public;
grant execute on function public.get_portal_invite(text) to anon, authenticated;

drop policy if exists "portal users update self" on public.portal_users;
create policy "portal users update self" on public.portal_users
  for update to authenticated
  using (
    active = true
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    active = true
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create or replace function public.accept_portal_invite(
  invite_token text,
  first_name_value text,
  last_name_value text,
  phone_value text,
  display_name_value text,
  communication_opt_in_value boolean
)
returns table(email text)
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_row public.portal_invites%rowtype;
begin
  select *
    into invite_row
  from public.portal_invites
  where token = invite_token
    and accepted_at is null
    and expires_at > now()
  limit 1;

  if invite_row.id is null then
    raise exception 'Portal invite is invalid or expired.';
  end if;

  insert into public.portal_users (
    person_id,
    email,
    display_name,
    first_name,
    last_name,
    phone,
    communication_opt_in,
    active
  )
  values (
    invite_row.person_id,
    lower(invite_row.email),
    nullif(display_name_value, ''),
    first_name_value,
    last_name_value,
    nullif(phone_value, ''),
    communication_opt_in_value,
    true
  )
  on conflict (person_id, email)
  do update set
    display_name = excluded.display_name,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    phone = excluded.phone,
    communication_opt_in = excluded.communication_opt_in,
    active = true,
    updated_at = now();

  update public.portal_invites
  set accepted_at = now()
  where id = invite_row.id;

  return query select lower(invite_row.email);
end;
$$;

revoke all on function public.accept_portal_invite(
  text,
  text,
  text,
  text,
  text,
  boolean
) from public;
grant execute on function public.accept_portal_invite(
  text,
  text,
  text,
  text,
  text,
  boolean
) to anon, authenticated;
