-- Preserve application first/last name fields on submissions and contacts.

alter table public.submissions
  add column if not exists first_name text,
  add column if not exists last_name text;

alter table public.people
  add column if not exists first_name text,
  add column if not exists last_name text;

update public.submissions
set
  first_name = coalesce(
    first_name,
    nullif(split_part(coalesce(legal_name, name), ' ', 1), '')
  ),
  last_name = coalesce(
    last_name,
    nullif(
      regexp_replace(coalesce(legal_name, name), '^\S+\s*', ''),
      ''
    )
  )
where (first_name is null or last_name is null)
  and coalesce(legal_name, name) is not null;

update public.people
set
  first_name = coalesce(
    first_name,
    nullif(split_part(coalesce(legal_name, name), ' ', 1), '')
  ),
  last_name = coalesce(
    last_name,
    nullif(
      regexp_replace(coalesce(legal_name, name), '^\S+\s*', ''),
      ''
    )
  )
where (first_name is null or last_name is null)
  and coalesce(legal_name, name) is not null;
