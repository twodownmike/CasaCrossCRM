-- Add useful follow-up questions to the live model intake while preserving
-- existing field keys and response data.

do $$
declare
  model_form_id uuid := '12f7594c-db05-4eb8-98e1-5f7068dffe0a';
  agency_field_id uuid := '82a4b981-49ec-44d5-92f8-3a2df3a4903b';
  cost_field_id uuid := 'd7b57cd6-c539-4001-b5bf-11282230456e';
  modeling_style_field_id uuid := 'f4778be4-ebad-43cb-b67d-923e982c8e7b';
begin
  if not exists (select 1 from public.forms where id = model_form_id) then
    return;
  end if;

  update public.form_fields
  set position = position + 1
  where form_id = model_form_id and position >= 17;

  insert into public.form_fields (
    form_id, position, field_key, label, type, required, helper,
    condition_field_id, condition_operator, condition_value
  ) values (
    model_form_id, 17, 'agency_representation_details',
    'Tell us about your agency representation.', 'textarea', true,
    'Include the agency name and your primary contact, if applicable.',
    agency_field_id, 'equals', 'Yes'
  )
  on conflict (form_id, field_key) do update set
    position = excluded.position,
    label = excluded.label,
    type = excluded.type,
    required = excluded.required,
    helper = excluded.helper,
    condition_field_id = excluded.condition_field_id,
    condition_operator = excluded.condition_operator,
    condition_value = excluded.condition_value;

  update public.form_fields
  set position = position + 1
  where form_id = model_form_id and position >= 22;

  insert into public.form_fields (
    form_id, position, field_key, label, type, required, helper,
    condition_field_id, condition_operator, condition_value
  ) values (
    model_form_id, 22, 'collaboration_structure_concerns',
    'What concerns or questions do you have about these collaboration structures?',
    'textarea', true, null, cost_field_id, 'equals', 'No'
  )
  on conflict (form_id, field_key) do update set
    position = excluded.position,
    label = excluded.label,
    type = excluded.type,
    required = excluded.required,
    helper = excluded.helper,
    condition_field_id = excluded.condition_field_id,
    condition_operator = excluded.condition_operator,
    condition_value = excluded.condition_value;

  update public.form_fields
  set position = position + 1
  where form_id = model_form_id and position >= 32;

  insert into public.form_fields (
    form_id, position, field_key, label, type, required, helper,
    condition_field_id, condition_operator, condition_value
  ) values (
    model_form_id, 32, 'couples_modeling_details',
    'Tell us about the person you would model with.', 'textarea', true,
    'Include their name, relationship to you, and modeling experience.',
    modeling_style_field_id, 'not_equals', 'Solo'
  )
  on conflict (form_id, field_key) do update set
    position = excluded.position,
    label = excluded.label,
    type = excluded.type,
    required = excluded.required,
    helper = excluded.helper,
    condition_field_id = excluded.condition_field_id,
    condition_operator = excluded.condition_operator,
    condition_value = excluded.condition_value;

  update public.form_fields set
    label = 'Have you participated in a styled photoshoot before?'
  where id = 'a27d162f-a192-46aa-a0f6-3b5823d17191';

  update public.form_fields set
    helper = 'Shared costs are only used to cover incurred expenses, such as dress cleaning services.'
  where id = cost_field_id;

  update public.form_fields set
    label = 'We are a community-oriented business. Our vendors may use these images in their own marketing materials. Are you comfortable with this?'
  where id = '021ae545-c12c-47a4-bbcd-6e33870fb8e7';

  update public.form_fields set
    label = 'I am comfortable working with…'
  where id = 'dc35ead6-16be-473f-a183-b396274a4998';

  update public.form_fields set type = 'textarea'
  where id in (
    '089e78f4-4722-4d61-ab68-17a48b4df2cc',
    '31625b1f-a51b-46a2-89bb-548cf28a73ed',
    '39acc433-922d-4a94-9c57-483f220ce42a',
    '8a6486f2-11c1-4ab7-9049-afa3385c2a66',
    'f69141d5-323a-4bf5-90c4-726941672f26',
    'c346dcd7-0ff9-4e57-bf23-dbe55d8e9f76'
  );
end;
$$;
