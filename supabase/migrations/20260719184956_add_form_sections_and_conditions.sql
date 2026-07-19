alter table public.form_fields
  add column if not exists show_if_previous_yes boolean not null default false;

comment on column public.form_fields.show_if_previous_yes is
  'Show this field only when the previous answerable field has a Yes value.';
