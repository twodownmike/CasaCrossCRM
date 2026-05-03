-- Public-facing event landing pages.
-- When events.is_public = true, anonymous visitors can read a stripped-down
-- view of the event (title, description, mood) at /e/<slug>.

alter table public.events
  add column if not exists is_public boolean not null default false,
  add column if not exists public_slug text;

create unique index if not exists events_public_slug_idx
  on public.events (public_slug)
  where public_slug is not null;

-- Slug helpers
create or replace function public.slugify(input text)
returns text language sql immutable as $$
  select regexp_replace(
    regexp_replace(lower(coalesce(input,'')), '[^a-z0-9]+', '-', 'g'),
    '(^-+|-+$)', '', 'g'
  );
$$;

create or replace function public.set_public_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
  i int := 0;
begin
  if new.is_public and (new.public_slug is null or new.public_slug = '') then
    base := public.slugify(new.name);
    if base = '' then base := 'event'; end if;
    candidate := base;
    while exists (
      select 1 from public.events
      where public_slug = candidate and id <> new.id
    ) loop
      i := i + 1;
      candidate := base || '-' || i;
    end loop;
    new.public_slug := candidate;
  end if;
  return new;
end;
$$;

drop trigger if exists set_public_slug_trg on public.events;
create trigger set_public_slug_trg
  before insert or update on public.events
  for each row execute procedure public.set_public_slug();

-- Anon read for public events. RLS combines policies with OR, so this is
-- additive — team members keep full access via the existing team policy.
drop policy if exists "anon reads public events" on public.events;
create policy "anon reads public events"
  on public.events for select
  to anon, authenticated
  using (is_public = true);

drop policy if exists "anon reads public mood images" on public.mood_images;
create policy "anon reads public mood images"
  on public.mood_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = mood_images.event_id and e.is_public = true
    )
  );
