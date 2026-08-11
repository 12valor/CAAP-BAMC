-- Remote migration version: 20260811125526
create function public.set_account_status(
  actor_profile_id uuid,
  target_profile_id uuid,
  account_enabled boolean,
  change_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_status text;
  next_status text := case when account_enabled then 'active' else 'disabled' end;
  target_role text;
begin
  if not exists (
    select 1 from public.profiles
    where id = actor_profile_id
      and role = 'admin'
      and status = 'active'
      and deleted_at is null
  ) then
    raise exception 'An active administrator is required.' using errcode = '42501';
  end if;

  if length(btrim(change_reason)) < 5 then
    raise exception 'A meaningful account status reason is required.' using errcode = '23514';
  end if;

  select status, role into previous_status, target_role
  from public.profiles
  where id = target_profile_id and deleted_at is null
  for update;

  if not found then
    raise exception 'Account profile not found.' using errcode = 'P0002';
  end if;

  if not account_enabled and actor_profile_id = target_profile_id then
    raise exception 'Administrators cannot disable their own account.' using errcode = '42501';
  end if;

  if not account_enabled and target_role = 'admin' and (
    select count(*) from public.profiles
    where role = 'admin' and status = 'active' and deleted_at is null
  ) <= 1 then
    raise exception 'The final active administrator cannot be disabled.' using errcode = '23514';
  end if;

  if previous_status = next_status then
    return;
  end if;

  update public.profiles
  set status = next_status, updated_by = actor_profile_id
  where id = target_profile_id;

  insert into public.audit_logs (
    actor_profile_id, action, entity_table, entity_id,
    old_data, new_data, reason, metadata
  ) values (
    actor_profile_id, 'update', 'profiles', target_profile_id::text,
    jsonb_build_object('status', previous_status),
    jsonb_build_object('status', next_status),
    btrim(change_reason),
    jsonb_build_object('event', 'account_status_change')
  );
end
$$;

create function public.record_password_reset(
  actor_profile_id uuid,
  target_profile_id uuid,
  reset_reason text,
  generated_password boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = actor_profile_id
      and role = 'admin'
      and status = 'active'
      and deleted_at is null
  ) then
    raise exception 'An active administrator is required.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = target_profile_id and deleted_at is null
  ) then
    raise exception 'Account profile not found.' using errcode = 'P0002';
  end if;

  if length(btrim(reset_reason)) < 5 then
    raise exception 'A meaningful password reset reason is required.' using errcode = '23514';
  end if;

  insert into public.audit_logs (
    actor_profile_id, action, entity_table, entity_id,
    reason, metadata
  ) values (
    actor_profile_id, 'password_reset', 'profiles', target_profile_id::text,
    btrim(reset_reason),
    jsonb_build_object('generated_password', generated_password)
  );
end
$$;

revoke execute on function public.set_account_status(uuid, uuid, boolean, text)
  from public, anon, authenticated, service_role;
revoke execute on function public.record_password_reset(uuid, uuid, text, boolean)
  from public, anon, authenticated, service_role;
grant execute on function public.set_account_status(uuid, uuid, boolean, text) to service_role;
grant execute on function public.record_password_reset(uuid, uuid, text, boolean) to service_role;

notify pgrst, 'reload schema';
