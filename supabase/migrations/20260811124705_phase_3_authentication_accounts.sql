-- Remote migration version: 20260811124705
create table public.account_usernames (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete restrict,
  username text not null unique,
  internal_auth_identifier text not null unique,
  last_successful_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (username = lower(btrim(username))),
  check (username ~ '^[a-z0-9][a-z0-9._-]{2,31}$'),
  check (internal_auth_identifier = lower(btrim(internal_auth_identifier))),
  check (internal_auth_identifier ~ '^[0-9a-f-]{36}@accounts\.caap-bamc\.invalid$'),
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.login_activity (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  profile_id uuid references public.profiles (id) on delete set null,
  username_fingerprint text not null check (username_fingerprint ~ '^[0-9a-f]{64}$'),
  network_fingerprint text not null check (network_fingerprint ~ '^[0-9a-f]{64}$'),
  outcome text not null check (
    outcome in ('success', 'invalid_credentials', 'disabled', 'rate_limited', 'session_expired', 'logout')
  ),
  request_id uuid not null default gen_random_uuid(),
  user_agent text check (user_agent is null or length(user_agent) <= 512),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object')
);

create index login_activity_profile_cursor_idx
  on public.login_activity (profile_id, occurred_at desc, id desc);
create index login_activity_username_rate_idx
  on public.login_activity (username_fingerprint, occurred_at desc)
  where outcome in ('invalid_credentials', 'disabled', 'rate_limited');
create index login_activity_network_rate_idx
  on public.login_activity (network_fingerprint, occurred_at desc)
  where outcome in ('invalid_credentials', 'disabled', 'rate_limited');

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
  event_reason text;
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
    event_reason := new.deletion_reason;
    event_actor := coalesce((select auth.uid()), new.updated_by, new.deleted_by);
    if tg_table_name = 'system_settings' then
      event_action := 'settings_change';
    elsif old.deleted_at is null and new.deleted_at is not null then
      event_action := 'soft_delete';
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

create trigger account_usernames_lifecycle
before insert or update on public.account_usernames
for each row execute function private.set_lifecycle_fields();

create trigger account_usernames_audit
after insert or update on public.account_usernames
for each row execute function private.write_audit_log();

create trigger account_usernames_prevent_delete
before delete on public.account_usernames
for each row execute function private.prevent_hard_delete();

create function private.prevent_login_activity_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Login activity is append-only.' using errcode = '42501';
end
$$;

create trigger login_activity_immutable
before update or delete on public.login_activity
for each row execute function private.prevent_login_activity_changes();

create function public.bootstrap_first_admin(
  actor_auth_user_id uuid,
  account_username text,
  auth_identifier text,
  account_display_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.profiles
    where role = 'admin' and deleted_at is null
  ) then
    raise exception 'An administrator account already exists.' using errcode = '42501';
  end if;

  if not exists (select 1 from auth.users where id = actor_auth_user_id) then
    raise exception 'The Supabase Auth user does not exist.' using errcode = '23503';
  end if;

  insert into public.profiles (id, role, status, display_name)
  values (actor_auth_user_id, 'admin', 'active', btrim(account_display_name));

  insert into public.account_usernames (
    profile_id, username, internal_auth_identifier
  ) values (
    actor_auth_user_id, lower(btrim(account_username)), lower(btrim(auth_identifier))
  );
end
$$;

create function public.create_employee_account(
  actor_profile_id uuid,
  employee_record_id uuid,
  new_auth_user_id uuid,
  account_username text,
  auth_identifier text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  employee_record public.employee_profiles%rowtype;
  account_display_name text;
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

  if not exists (select 1 from auth.users where id = new_auth_user_id) then
    raise exception 'The Supabase Auth user does not exist.' using errcode = '23503';
  end if;

  select * into employee_record
  from public.employee_profiles
  where id = employee_record_id and deleted_at is null
  for update;

  if not found then
    raise exception 'Employee record not found.' using errcode = 'P0002';
  end if;

  if employee_record.profile_id is not null then
    raise exception 'Employee already has an account.' using errcode = '23505';
  end if;

  account_display_name := concat_ws(
    ' ', employee_record.first_name, nullif(employee_record.middle_name, ''),
    employee_record.last_name, nullif(employee_record.suffix, '')
  );

  insert into public.profiles (
    id, role, status, display_name, created_by, updated_by
  ) values (
    new_auth_user_id, 'employee', 'active', account_display_name,
    actor_profile_id, actor_profile_id
  );

  insert into public.account_usernames (
    profile_id, username, internal_auth_identifier, created_by, updated_by
  ) values (
    new_auth_user_id, lower(btrim(account_username)), lower(btrim(auth_identifier)),
    actor_profile_id, actor_profile_id
  );

  update public.employee_profiles
  set profile_id = new_auth_user_id, updated_by = actor_profile_id
  where id = employee_record_id;
end
$$;

revoke execute on function public.bootstrap_first_admin(uuid, text, text, text)
  from public, anon, authenticated, service_role;
revoke execute on function public.create_employee_account(uuid, uuid, uuid, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.bootstrap_first_admin(uuid, text, text, text) to service_role;
grant execute on function public.create_employee_account(uuid, uuid, uuid, text, text) to service_role;

alter table public.account_usernames enable row level security;
alter table public.login_activity enable row level security;

create policy login_activity_admin_select
on public.login_activity for select to authenticated
using ((select private.is_admin()));

revoke all privileges on table public.account_usernames from anon, authenticated, service_role;
revoke all privileges on table public.login_activity from anon, authenticated, service_role;
revoke all privileges on sequence public.login_activity_id_seq from anon, authenticated, service_role;

grant select on table public.login_activity to authenticated;
grant select, insert, update on table public.account_usernames to service_role;
grant select, insert on table public.login_activity to service_role;
grant usage, select on sequence public.login_activity_id_seq to service_role;

revoke execute on function private.prevent_login_activity_changes() from public, anon, authenticated, service_role;

notify pgrst, 'reload schema';
