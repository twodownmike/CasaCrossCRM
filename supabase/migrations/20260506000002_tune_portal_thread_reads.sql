create index if not exists portal_thread_reads_person_idx
  on public.portal_thread_reads (person_id);

drop policy if exists "team portal reads select" on public.portal_thread_reads;
create policy "team portal reads select" on public.portal_thread_reads
  for select to authenticated
  using (
    (select public.is_team_member())
    and reader_kind = 'team'
    and user_id = (select auth.uid())
  );

drop policy if exists "team portal reads insert" on public.portal_thread_reads;
create policy "team portal reads insert" on public.portal_thread_reads
  for insert to authenticated
  with check (
    (select public.is_team_member())
    and reader_kind = 'team'
    and user_id = (select auth.uid())
  );

drop policy if exists "team portal reads update" on public.portal_thread_reads;
create policy "team portal reads update" on public.portal_thread_reads
  for update to authenticated
  using (
    (select public.is_team_member())
    and reader_kind = 'team'
    and user_id = (select auth.uid())
  )
  with check (
    (select public.is_team_member())
    and reader_kind = 'team'
    and user_id = (select auth.uid())
  );

drop policy if exists "portal reads own read receipts" on public.portal_thread_reads;
create policy "portal reads own read receipts" on public.portal_thread_reads
  for select to authenticated
  using (
    reader_kind = 'portal'
    and user_id = (select auth.uid())
    and person_id = (select public.portal_person_id())
  );

drop policy if exists "portal creates own read receipts" on public.portal_thread_reads;
create policy "portal creates own read receipts" on public.portal_thread_reads
  for insert to authenticated
  with check (
    reader_kind = 'portal'
    and user_id = (select auth.uid())
    and person_id = (select public.portal_person_id())
    and exists (
      select 1
      from public.participants pp
      where pp.event_id = portal_thread_reads.event_id
        and pp.person_id = (select public.portal_person_id())
    )
  );

drop policy if exists "portal updates own read receipts" on public.portal_thread_reads;
create policy "portal updates own read receipts" on public.portal_thread_reads
  for update to authenticated
  using (
    reader_kind = 'portal'
    and user_id = (select auth.uid())
    and person_id = (select public.portal_person_id())
  )
  with check (
    reader_kind = 'portal'
    and user_id = (select auth.uid())
    and person_id = (select public.portal_person_id())
  );
