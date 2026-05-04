-- Admin: studio settings + team management

-- ─── Studio settings (single row) ───
create table if not exists public.studio_settings (
  id smallint primary key default 1,
  studio_name text not null default 'Casa Cross Events',
  contact_email text,
  contact_phone text,
  instagram text,
  website text,
  apply_intro text,
  apply_thank_you text,
  email_signature text,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into public.studio_settings (id) values (1) on conflict do nothing;

create or replace function public.touch_settings_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists studio_settings_touch on public.studio_settings;
create trigger studio_settings_touch
  before update on public.studio_settings
  for each row execute procedure public.touch_settings_updated_at();

alter table public.studio_settings enable row level security;

drop policy if exists "team reads settings" on public.studio_settings;
create policy "team reads settings" on public.studio_settings
  for select to authenticated using (public.is_team_member());

drop policy if exists "team updates settings" on public.studio_settings;
create policy "team updates settings" on public.studio_settings
  for update to authenticated using (public.is_team_member());

-- Public-facing pages (apply, thank-you) can read settings
drop policy if exists "anon reads settings" on public.studio_settings;
create policy "anon reads settings" on public.studio_settings
  for select to anon using (true);

-- ─── Team management RPCs ───
create or replace function public.list_team_members()
returns table (
  user_id uuid,
  email text,
  display_name text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select tm.user_id, u.email::text, tm.display_name, tm.created_at
  from public.team_members tm
  join auth.users u on u.id = tm.user_id
  where public.is_team_member()
  order by tm.created_at;
$$;

revoke all on function public.list_team_members() from public;
grant execute on function public.list_team_members() to authenticated;

create or replace function public.invite_team_member(
  member_email text,
  name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  if not public.is_team_member() then
    return jsonb_build_object('ok', false, 'error', 'Not authorized.');
  end if;
  select id into uid from auth.users where lower(email) = lower(member_email);
  if uid is null then
    return jsonb_build_object(
      'ok', false,
      'error',
      'No account found for that email yet. Have them sign in once at /login first, then add them.'
    );
  end if;
  insert into public.team_members (user_id, display_name)
  values (uid, coalesce(name, split_part(member_email,'@',1)))
  on conflict (user_id) do update set
    display_name = excluded.display_name;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.invite_team_member(text, text) from public;
grant execute on function public.invite_team_member(text, text) to authenticated;

create or replace function public.remove_team_member(uid uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_team_member() then
    return jsonb_build_object('ok', false, 'error', 'Not authorized.');
  end if;
  if uid = auth.uid() then
    return jsonb_build_object(
      'ok', false,
      'error', 'You can''t remove yourself.'
    );
  end if;
  if (select count(*) from public.team_members) <= 1 then
    return jsonb_build_object(
      'ok', false,
      'error', 'Can''t remove the last remaining team member.'
    );
  end if;
  delete from public.team_members where user_id = uid;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.remove_team_member(uuid) from public;
grant execute on function public.remove_team_member(uuid) to authenticated;
