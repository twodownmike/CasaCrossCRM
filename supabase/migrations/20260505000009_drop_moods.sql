drop table if exists public.mood_images cascade;

alter table public.events drop column if exists moodboard;
