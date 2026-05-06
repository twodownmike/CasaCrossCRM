create table if not exists public.portal_thread_reads (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reader_kind text not null check (reader_kind in ('team', 'portal')),
  read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, person_id, user_id, reader_kind)
);

alter table public.portal_thread_reads enable row level security;

create index if not exists portal_thread_reads_lookup_idx
  on public.portal_thread_reads (user_id, reader_kind, event_id, person_id);

drop trigger if exists portal_thread_reads_touch on public.portal_thread_reads;
create trigger portal_thread_reads_touch
  before update on public.portal_thread_reads
  for each row execute function public.touch_updated_at();

drop policy if exists "team portal reads select" on public.portal_thread_reads;
create policy "team portal reads select" on public.portal_thread_reads
  for select to authenticated
  using (public.is_team_member() and reader_kind = 'team' and user_id = auth.uid());

drop policy if exists "team portal reads insert" on public.portal_thread_reads;
create policy "team portal reads insert" on public.portal_thread_reads
  for insert to authenticated
  with check (
    public.is_team_member()
    and reader_kind = 'team'
    and user_id = auth.uid()
  );

drop policy if exists "team portal reads update" on public.portal_thread_reads;
create policy "team portal reads update" on public.portal_thread_reads
  for update to authenticated
  using (
    public.is_team_member()
    and reader_kind = 'team'
    and user_id = auth.uid()
  )
  with check (
    public.is_team_member()
    and reader_kind = 'team'
    and user_id = auth.uid()
  );

drop policy if exists "portal reads own read receipts" on public.portal_thread_reads;
create policy "portal reads own read receipts" on public.portal_thread_reads
  for select to authenticated
  using (
    reader_kind = 'portal'
    and user_id = auth.uid()
    and person_id = public.portal_person_id()
  );

drop policy if exists "portal creates own read receipts" on public.portal_thread_reads;
create policy "portal creates own read receipts" on public.portal_thread_reads
  for insert to authenticated
  with check (
    reader_kind = 'portal'
    and user_id = auth.uid()
    and person_id = public.portal_person_id()
    and exists (
      select 1
      from public.participants pp
      where pp.event_id = portal_thread_reads.event_id
        and pp.person_id = public.portal_person_id()
    )
  );

drop policy if exists "portal updates own read receipts" on public.portal_thread_reads;
create policy "portal updates own read receipts" on public.portal_thread_reads
  for update to authenticated
  using (
    reader_kind = 'portal'
    and user_id = auth.uid()
    and person_id = public.portal_person_id()
  )
  with check (
    reader_kind = 'portal'
    and user_id = auth.uid()
    and person_id = public.portal_person_id()
  );
