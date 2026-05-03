-- Add a dedicated 'specialty' field for people (especially vendors).
-- Surfaces directly on the People list so Anna can see what each
-- person offers without tapping in.

alter table public.people
  add column if not exists specialty text;
