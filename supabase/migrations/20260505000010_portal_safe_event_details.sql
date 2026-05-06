-- Client-facing event details should be separate from internal planning notes.

alter table public.events
  add column if not exists portal_brief text;
