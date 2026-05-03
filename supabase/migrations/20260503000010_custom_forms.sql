-- Custom form builder.
-- Anna creates forms with arbitrary fields, shares /f/<slug>, collects
-- responses. Anon visitors can read & submit only published forms.

create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  is_published boolean not null default false,
  thank_you_message text,
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms on delete cascade,
  position int not null default 0,
  field_key text not null,
  label text not null,
  type text not null,
  options text[],
  required boolean not null default false,
  placeholder text,
  helper text,
  unique (form_id, field_key)
);

create table if not exists public.form_responses (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Auto-generate slug from title if not provided
create or replace function public.set_form_slug()
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
  if (new.slug is null or new.slug = '') then
    base := public.slugify(new.title);
    if base = '' or base is null then base := 'form'; end if;
    candidate := base;
    while exists (select 1 from public.forms where slug = candidate and id <> new.id) loop
      i := i + 1;
      candidate := base || '-' || i;
    end loop;
    new.slug := candidate;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_form_slug_trg on public.forms;
create trigger set_form_slug_trg
  before insert or update on public.forms
  for each row execute procedure public.set_form_slug();

-- RLS
alter table public.forms enable row level security;
alter table public.form_fields enable row level security;
alter table public.form_responses enable row level security;

-- forms
drop policy if exists "team forms select" on public.forms;
create policy "team forms select" on public.forms for select to authenticated
  using (public.is_team_member());
drop policy if exists "team forms insert" on public.forms;
create policy "team forms insert" on public.forms for insert to authenticated
  with check (public.is_team_member());
drop policy if exists "team forms update" on public.forms;
create policy "team forms update" on public.forms for update to authenticated
  using (public.is_team_member());
drop policy if exists "team forms delete" on public.forms;
create policy "team forms delete" on public.forms for delete to authenticated
  using (public.is_team_member());
drop policy if exists "anon reads published forms" on public.forms;
create policy "anon reads published forms" on public.forms for select
  to anon using (is_published = true);

-- form_fields
drop policy if exists "team fields select" on public.form_fields;
create policy "team fields select" on public.form_fields for select
  to authenticated using (public.is_team_member());
drop policy if exists "team fields insert" on public.form_fields;
create policy "team fields insert" on public.form_fields for insert
  to authenticated with check (public.is_team_member());
drop policy if exists "team fields update" on public.form_fields;
create policy "team fields update" on public.form_fields for update
  to authenticated using (public.is_team_member());
drop policy if exists "team fields delete" on public.form_fields;
create policy "team fields delete" on public.form_fields for delete
  to authenticated using (public.is_team_member());
drop policy if exists "anon reads fields of published" on public.form_fields;
create policy "anon reads fields of published" on public.form_fields for select
  to anon using (
    exists (
      select 1 from public.forms f
      where f.id = form_fields.form_id and f.is_published = true
    )
  );

-- form_responses
drop policy if exists "anyone submits to published" on public.form_responses;
create policy "anyone submits to published" on public.form_responses
  for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.forms f
      where f.id = form_responses.form_id and f.is_published = true
    )
  );
drop policy if exists "team reads responses" on public.form_responses;
create policy "team reads responses" on public.form_responses for select
  to authenticated using (public.is_team_member());
drop policy if exists "team deletes responses" on public.form_responses;
create policy "team deletes responses" on public.form_responses for delete
  to authenticated using (public.is_team_member());

create index if not exists forms_slug_idx on public.forms (slug);
create index if not exists form_fields_form_idx on public.form_fields (form_id, position);
create index if not exists form_responses_form_idx on public.form_responses (form_id, created_at desc);
