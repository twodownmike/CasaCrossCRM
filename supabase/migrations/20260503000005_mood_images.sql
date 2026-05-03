-- Mood board image uploads.
-- Reuses the existing 'event-covers' storage bucket; this table tracks
-- the public URLs and lets us delete individual images cleanly.

create table if not exists public.mood_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  url text not null,
  caption text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users
);

alter table public.mood_images enable row level security;

drop policy if exists "team mood select" on public.mood_images;
create policy "team mood select"
  on public.mood_images for select
  using (public.is_team_member());

drop policy if exists "team mood insert" on public.mood_images;
create policy "team mood insert"
  on public.mood_images for insert
  with check (public.is_team_member());

drop policy if exists "team mood delete" on public.mood_images;
create policy "team mood delete"
  on public.mood_images for delete
  using (public.is_team_member());

create index if not exists mood_images_event_idx
  on public.mood_images (event_id, created_at desc);
