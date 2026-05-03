-- Casa Cross CRM — initial schema
-- All authenticated users share access (small studio team).

set check_function_bodies = off;

-- ─────────────────────────────────────────────────────────────
-- Allowed users (whitelist). Members of the team own everything.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.team_members (
  user_id uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
alter table public.team_members enable row level security;
create policy "team can read members"
  on public.team_members for select
  using ( exists (select 1 from public.team_members tm where tm.user_id = auth.uid()) );

-- Helper: is the caller a team member?
create or replace function public.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members where user_id = auth.uid()
  );
$$;

-- Auto-add the very first signed-in user as a team member.
create or replace function public.bootstrap_first_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.team_members) = 0 then
    insert into public.team_members (user_id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  end if;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.bootstrap_first_member();

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
do $$ begin
  create type role_kind as enum ('photographer','model','vendor','venue','hmua','stylist','sponsor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_status as enum ('confirmed','planning','pending','wrapped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pay_status as enum ('paid','partial','due','comp');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contract_status as enum ('signed','sent','unsent');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- People (clients/vendors/team contacts)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role role_kind not null,
  email text,
  phone text,
  instagram text,
  location text,
  bio text,
  initials text,
  tint text,
  ink text,
  joined_at date default current_date,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users
);
alter table public.people enable row level security;
create policy "team people select" on public.people for select using ( public.is_team_member() );
create policy "team people insert" on public.people for insert with check ( public.is_team_member() );
create policy "team people update" on public.people for update using ( public.is_team_member() );
create policy "team people delete" on public.people for delete using ( public.is_team_member() );

-- ─────────────────────────────────────────────────────────────
-- Events (styled shoots)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subtitle text,
  description text,
  date date not null,
  time_label text,
  cover text default 'modern',
  venue_id uuid references public.people,
  location text,
  status event_status not null default 'planning',
  stage text,
  capacity int default 12,
  tags text[] default '{}',
  moodboard text[] default '{}',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users
);
alter table public.events enable row level security;
create policy "team events select" on public.events for select using ( public.is_team_member() );
create policy "team events insert" on public.events for insert with check ( public.is_team_member() );
create policy "team events update" on public.events for update using ( public.is_team_member() );
create policy "team events delete" on public.events for delete using ( public.is_team_member() );

-- ─────────────────────────────────────────────────────────────
-- Participants (junction event ↔ person, with money & contract)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  person_id uuid not null references public.people on delete cascade,
  role role_kind not null,
  rate numeric(10,2) not null default 0,
  paid numeric(10,2) not null default 0,
  status pay_status not null default 'due',
  contract contract_status not null default 'unsent',
  due_date date,
  unique (event_id, person_id)
);
alter table public.participants enable row level security;
create policy "team parts select" on public.participants for select using ( public.is_team_member() );
create policy "team parts insert" on public.participants for insert with check ( public.is_team_member() );
create policy "team parts update" on public.participants for update using ( public.is_team_member() );
create policy "team parts delete" on public.participants for delete using ( public.is_team_member() );

-- ─────────────────────────────────────────────────────────────
-- Tasks
-- ─────────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events on delete cascade,
  title text not null,
  done boolean not null default false,
  due date,
  created_at timestamptz not null default now()
);
alter table public.tasks enable row level security;
create policy "team tasks select" on public.tasks for select using ( public.is_team_member() );
create policy "team tasks insert" on public.tasks for insert with check ( public.is_team_member() );
create policy "team tasks update" on public.tasks for update using ( public.is_team_member() );
create policy "team tasks delete" on public.tasks for delete using ( public.is_team_member() );

-- ─────────────────────────────────────────────────────────────
-- Activity feed
-- ─────────────────────────────────────────────────────────────
create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events on delete cascade,
  what text not null,
  who text,
  tone text,
  occurred_at timestamptz not null default now()
);
alter table public.activity enable row level security;
create policy "team activity select" on public.activity for select using ( public.is_team_member() );
create policy "team activity insert" on public.activity for insert with check ( public.is_team_member() );
create policy "team activity delete" on public.activity for delete using ( public.is_team_member() );

-- ─────────────────────────────────────────────────────────────
-- Messages (per-event chat)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  sender_id uuid references auth.users,
  sender_name text,
  text text not null,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy "team messages select" on public.messages for select using ( public.is_team_member() );
create policy "team messages insert" on public.messages for insert with check ( public.is_team_member() );

-- ─────────────────────────────────────────────────────────────
-- Notes (per-person)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users
);
alter table public.notes enable row level security;
create policy "team notes select" on public.notes for select using ( public.is_team_member() );
create policy "team notes insert" on public.notes for insert with check ( public.is_team_member() );
create policy "team notes update" on public.notes for update using ( public.is_team_member() );
create policy "team notes delete" on public.notes for delete using ( public.is_team_member() );

-- Useful indexes
create index if not exists events_date_idx on public.events (date);
create index if not exists participants_event_idx on public.participants (event_id);
create index if not exists participants_person_idx on public.participants (person_id);
create index if not exists tasks_event_idx on public.tasks (event_id);
create index if not exists messages_event_idx on public.messages (event_id, created_at);
