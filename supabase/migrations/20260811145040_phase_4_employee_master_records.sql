create extension if not exists pg_trgm with schema extensions;

alter table public.employee_profiles
  add column employment_category text not null default 'Unspecified'
    check (length(btrim(employment_category)) > 0),
  add column email_address text,
  add column mobile_number text,
  add column address_text text,
  add column notes text,
  add column search_text text generated always as (
    lower(
      employee_number || ' ' || first_name || ' ' ||
      coalesce(middle_name, '') || ' ' || last_name || ' ' ||
      coalesce(suffix, '') || ' ' || coalesce(department, '') || ' ' ||
      coalesce(position_title, '') || ' ' || employment_category || ' ' ||
      coalesce(email_address, '') || ' ' || coalesce(mobile_number, '')
    )
  ) stored,
  add constraint employee_profiles_email_format_check check (
    email_address is null
    or email_address ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  );

create index employee_profiles_search_idx
  on public.employee_profiles using gin (search_text extensions.gin_trgm_ops)
  where deleted_at is null;
create index employee_profiles_directory_cursor_idx
  on public.employee_profiles (lower(last_name), lower(first_name), id)
  where deleted_at is null;
create index employee_profiles_status_idx
  on public.employee_profiles (employment_status, lower(last_name), id)
  where deleted_at is null;
create index employee_profiles_department_idx
  on public.employee_profiles (lower(department), lower(last_name), id)
  where deleted_at is null and department is not null;
create index employee_profiles_category_idx
  on public.employee_profiles (lower(employment_category), lower(last_name), id)
  where deleted_at is null;

create or replace function private.assert_admin_actor(actor_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if actor_id is null or not exists (
    select 1
    from public.profiles p
    where p.id = actor_id
      and p.role = 'admin'
      and p.status = 'active'
      and p.deleted_at is null
  ) then
    raise exception 'Administrator authorization is required.' using errcode = '42501';
  end if;
end
$$;

create or replace function private.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_action text;
  before_data jsonb;
  after_data jsonb;
  record_id text;
  event_reason text := nullif(current_setting('app.audit_reason', true), '');
  event_actor uuid;
begin
  if tg_op = 'INSERT' then
    event_action := 'create';
    after_data := to_jsonb(new);
    record_id := new.id::text;
    event_actor := coalesce((select auth.uid()), new.created_by);
  else
    before_data := to_jsonb(old);
    after_data := to_jsonb(new);
    record_id := new.id::text;
    event_actor := coalesce((select auth.uid()), new.updated_by, new.deleted_by);
    if tg_table_name = 'system_settings'
      or tg_table_name in (
        'financial_categories', 'transaction_types', 'loan_types',
        'rebate_types', 'interest_methods', 'penalty_rules'
      ) then
      event_action := 'settings_change';
    elsif old.deleted_at is null and new.deleted_at is not null then
      event_action := 'soft_delete';
      event_reason := coalesce(new.deletion_reason, event_reason);
    elsif old.deleted_at is not null and new.deleted_at is null then
      event_action := 'restore';
    else
      event_action := 'update';
    end if;
  end if;

  if tg_table_name = 'account_usernames' then
    before_data := before_data - 'internal_auth_identifier';
    after_data := after_data - 'internal_auth_identifier';
  end if;

  insert into public.audit_logs (
    actor_profile_id, action, entity_table, entity_id,
    old_data, new_data, reason
  ) values (
    event_actor, event_action, tg_table_name, record_id,
    before_data, after_data, event_reason
  );
  return new;
end
$$;

create function public.manage_employee_record(
  actor_profile_id uuid,
  operation text,
  employee_record_id uuid default null,
  payload jsonb default '{}'::jsonb,
  change_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid := employee_record_id;
  linked_profile_id uuid;
begin
  perform private.assert_admin_actor(actor_profile_id);

  if jsonb_typeof(payload) <> 'object' then
    raise exception 'Employee payload must be a JSON object.' using errcode = '22023';
  end if;

  if operation = 'create' then
    perform set_config('app.audit_reason', 'Employee record created', true);
    insert into public.employee_profiles (
      employee_number, first_name, middle_name, last_name, suffix,
      department, position_title, employment_category, employment_status,
      email_address, mobile_number, address_text, hire_date, separation_date,
      notes, created_by, updated_by
    ) values (
      btrim(payload->>'employee_number'), btrim(payload->>'first_name'),
      nullif(btrim(payload->>'middle_name'), ''), btrim(payload->>'last_name'),
      nullif(btrim(payload->>'suffix'), ''), nullif(btrim(payload->>'department'), ''),
      nullif(btrim(payload->>'position_title'), ''), btrim(payload->>'employment_category'),
      payload->>'employment_status', nullif(lower(btrim(payload->>'email_address')), ''),
      nullif(btrim(payload->>'mobile_number'), ''), nullif(btrim(payload->>'address_text'), ''),
      nullif(payload->>'hire_date', '')::date, nullif(payload->>'separation_date', '')::date,
      nullif(btrim(payload->>'notes'), ''), actor_profile_id, actor_profile_id
    ) returning id into target_id;
  elsif operation = 'update' then
    if target_id is null or change_reason is null or length(btrim(change_reason)) < 5 then
      raise exception 'Employee updates require a record and reason.' using errcode = '22023';
    end if;
    perform set_config('app.audit_reason', btrim(change_reason), true);
    update public.employee_profiles ep set
      employee_number = btrim(payload->>'employee_number'),
      first_name = btrim(payload->>'first_name'),
      middle_name = nullif(btrim(payload->>'middle_name'), ''),
      last_name = btrim(payload->>'last_name'),
      suffix = nullif(btrim(payload->>'suffix'), ''),
      department = nullif(btrim(payload->>'department'), ''),
      position_title = nullif(btrim(payload->>'position_title'), ''),
      employment_category = btrim(payload->>'employment_category'),
      employment_status = payload->>'employment_status',
      email_address = nullif(lower(btrim(payload->>'email_address')), ''),
      mobile_number = nullif(btrim(payload->>'mobile_number'), ''),
      address_text = nullif(btrim(payload->>'address_text'), ''),
      hire_date = nullif(payload->>'hire_date', '')::date,
      separation_date = nullif(payload->>'separation_date', '')::date,
      notes = nullif(btrim(payload->>'notes'), ''),
      updated_by = actor_profile_id
    where ep.id = target_id and ep.deleted_at is null;
    if not found then
      raise exception 'Employee record was not found.' using errcode = 'P0002';
    end if;
  elsif operation = 'archive' then
    if target_id is null or change_reason is null or length(btrim(change_reason)) < 5 then
      raise exception 'Archiving requires a record and reason.' using errcode = '22023';
    end if;
    select profile_id into linked_profile_id
    from public.employee_profiles where id = target_id and deleted_at is null;
    if not found then
      raise exception 'Employee record was not found.' using errcode = 'P0002';
    end if;
    perform set_config('app.audit_reason', btrim(change_reason), true);
    update public.employee_profiles set
      deleted_at = clock_timestamp(), deleted_by = actor_profile_id,
      deletion_reason = btrim(change_reason), updated_by = actor_profile_id
    where id = target_id;
    if linked_profile_id is not null then
      update public.profiles set status = 'disabled', updated_by = actor_profile_id
      where id = linked_profile_id and role = 'employee';
    end if;
  elsif operation = 'restore' then
    if target_id is null or change_reason is null or length(btrim(change_reason)) < 5 then
      raise exception 'Restoring requires a record and reason.' using errcode = '22023';
    end if;
    perform set_config('app.audit_reason', btrim(change_reason), true);
    update public.employee_profiles set
      deleted_at = null, deleted_by = null, deletion_reason = null,
      updated_by = actor_profile_id
    where id = target_id and deleted_at is not null;
    if not found then
      raise exception 'Archived employee record was not found.' using errcode = 'P0002';
    end if;
  else
    raise exception 'Unsupported employee operation.' using errcode = '22023';
  end if;

  return target_id;
end
$$;

create function public.get_admin_employee_page(
  actor_profile_id uuid,
  search_query text default null,
  status_filter text default null,
  department_filter text default null,
  category_filter text default null,
  include_archived boolean default false,
  cursor_sort_key text default null,
  cursor_id uuid default null,
  page_size integer default 25
)
returns table (
  id uuid,
  profile_id uuid,
  employee_number text,
  complete_name text,
  department text,
  position_title text,
  employment_category text,
  employment_status text,
  email_address text,
  mobile_number text,
  username text,
  account_status text,
  deleted_at timestamptz,
  transaction_count bigint,
  active_loan_count bigint,
  leave_balance_count bigint,
  document_count bigint,
  sort_key text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.assert_admin_actor(actor_profile_id);
  return query
  select
    ep.id, ep.profile_id, ep.employee_number,
    concat_ws(' ', ep.first_name, nullif(ep.middle_name, ''), ep.last_name, nullif(ep.suffix, '')),
    ep.department, ep.position_title, ep.employment_category, ep.employment_status,
    ep.email_address, ep.mobile_number, au.username, p.status, ep.deleted_at,
    (select count(*) from public.transactions t where t.employee_id = ep.id and t.deleted_at is null),
    (select count(*) from public.loans l where l.employee_id = ep.id and l.deleted_at is null and l.status = 'active'),
    (select count(*) from public.leave_balances lb where lb.employee_id = ep.id and lb.deleted_at is null),
    (select count(*) from public.documents d where d.employee_id = ep.id and d.deleted_at is null),
    lower(ep.last_name || '|' || ep.first_name || '|' || ep.employee_number)
  from public.employee_profiles ep
  left join public.account_usernames au on au.profile_id = ep.profile_id and au.deleted_at is null
  left join public.profiles p on p.id = ep.profile_id and p.deleted_at is null
  where (include_archived or ep.deleted_at is null)
    and (search_query is null or btrim(search_query) = '' or ep.search_text ilike '%' || lower(btrim(search_query)) || '%')
    and (status_filter is null or status_filter = '' or ep.employment_status = status_filter)
    and (department_filter is null or department_filter = '' or lower(ep.department) = lower(department_filter))
    and (category_filter is null or category_filter = '' or lower(ep.employment_category) = lower(category_filter))
    and (
      cursor_sort_key is null or cursor_id is null
      or (lower(ep.last_name || '|' || ep.first_name || '|' || ep.employee_number), ep.id)
        > (cursor_sort_key, cursor_id)
    )
  order by lower(ep.last_name || '|' || ep.first_name || '|' || ep.employee_number), ep.id
  limit least(greatest(page_size, 1), 100) + 1;
end
$$;

revoke execute on function private.assert_admin_actor(uuid) from public, anon, authenticated, service_role;
revoke execute on function public.manage_employee_record(uuid, text, uuid, jsonb, text) from public, anon, authenticated;
revoke execute on function public.get_admin_employee_page(uuid, text, text, text, text, boolean, text, uuid, integer) from public, anon, authenticated;
grant execute on function public.manage_employee_record(uuid, text, uuid, jsonb, text) to service_role;
grant execute on function public.get_admin_employee_page(uuid, text, text, text, text, boolean, text, uuid, integer) to service_role;

notify pgrst, 'reload schema';


