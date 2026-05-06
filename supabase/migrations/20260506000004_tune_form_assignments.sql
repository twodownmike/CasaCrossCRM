create index if not exists form_assignments_response_idx
  on public.form_assignments (response_id)
  where response_id is not null;

create index if not exists form_assignments_assigned_by_idx
  on public.form_assignments (assigned_by)
  where assigned_by is not null;
