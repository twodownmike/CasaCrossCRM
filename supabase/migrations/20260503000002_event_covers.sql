-- Event cover image uploads.
-- Adds a storage bucket and a column on events for the public URL.

alter table public.events
  add column if not exists cover_image_url text;

-- Public bucket: anyone with the URL can view, only team members can write.
insert into storage.buckets (id, name, public)
values ('event-covers', 'event-covers', true)
on conflict (id) do update set public = excluded.public;

-- Storage policies: read public, write only by team members.
drop policy if exists "team uploads to event-covers" on storage.objects;
create policy "team uploads to event-covers"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'event-covers' and public.is_team_member()
  );

drop policy if exists "team updates event-covers" on storage.objects;
create policy "team updates event-covers"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'event-covers' and public.is_team_member()
  );

drop policy if exists "team deletes event-covers" on storage.objects;
create policy "team deletes event-covers"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'event-covers' and public.is_team_member()
  );

drop policy if exists "anyone reads event-covers" on storage.objects;
create policy "anyone reads event-covers"
  on storage.objects for select
  using ( bucket_id = 'event-covers' );
