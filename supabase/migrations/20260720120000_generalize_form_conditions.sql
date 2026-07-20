alter table public.form_fields
  add column if not exists condition_field_id uuid references public.form_fields(id) on delete set null,
  add column if not exists condition_operator text,
  add column if not exists condition_value text;

alter table public.form_fields
  drop constraint if exists form_fields_condition_operator_check;

alter table public.form_fields
  add constraint form_fields_condition_operator_check
  check (
    condition_operator is null
    or condition_operator in ('equals', 'not_equals', 'contains', 'not_empty')
  );

with previous_questions as (
  select
    target.id as target_id,
    (
      select source.id
      from public.form_fields source
      where source.form_id = target.form_id
        and source.type <> 'section'
        and source.position < target.position
      order by source.position desc
      limit 1
    ) as source_id
  from public.form_fields target
  where target.show_if_previous_yes = true
    and target.condition_field_id is null
)
update public.form_fields target
set
  condition_field_id = previous_questions.source_id,
  condition_operator = 'equals',
  condition_value = 'Yes'
from previous_questions
where target.id = previous_questions.target_id
  and previous_questions.source_id is not null;

comment on column public.form_fields.condition_field_id is
  'Earlier answerable field that controls whether this field is shown.';
comment on column public.form_fields.condition_operator is
  'Comparison used against the controlling field: equals, not_equals, contains, or not_empty.';
comment on column public.form_fields.condition_value is
  'Value used by comparison operators that require one.';
