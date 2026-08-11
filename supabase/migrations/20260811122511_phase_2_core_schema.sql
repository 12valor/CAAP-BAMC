-- Remote migration version: 20260811122511
create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  role text not null check (role in ('admin', 'employee')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  display_name text not null check (length(btrim(display_name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.employee_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  employee_number text not null unique check (length(btrim(employee_number)) > 0),
  first_name text not null check (length(btrim(first_name)) > 0),
  middle_name text,
  last_name text not null check (length(btrim(last_name)) > 0),
  suffix text,
  department text,
  position_title text,
  employment_status text not null default 'active'
    check (employment_status in ('active', 'inactive', 'separated', 'retired')),
  hire_date date,
  separation_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (separation_date is null or hire_date is null or separation_date >= hire_date),
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.financial_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null check (length(btrim(code)) > 0),
  name text not null check (length(btrim(name)) > 0),
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.transaction_types (
  id uuid primary key default gen_random_uuid(),
  financial_category_id uuid not null references public.financial_categories (id) on delete restrict,
  code text not null check (length(btrim(code)) > 0),
  name text not null check (length(btrim(name)) > 0),
  direction text not null check (direction in ('debit', 'credit')),
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.loan_types (
  id uuid primary key default gen_random_uuid(),
  code text not null check (length(btrim(code)) > 0),
  name text not null check (length(btrim(name)) > 0),
  description text,
  calculation_strategy text not null default 'manual'
    check (calculation_strategy ~ '^[a-z][a-z0-9_]*$'),
  calculation_parameters jsonb not null default '{}'::jsonb
    check (jsonb_typeof(calculation_parameters) = 'object'),
  configuration_version integer not null default 1 check (configuration_version > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.rebate_types (
  id uuid primary key default gen_random_uuid(),
  code text not null check (length(btrim(code)) > 0),
  name text not null check (length(btrim(name)) > 0),
  description text,
  calculation_strategy text not null default 'manual'
    check (calculation_strategy ~ '^[a-z][a-z0-9_]*$'),
  calculation_parameters jsonb not null default '{}'::jsonb
    check (jsonb_typeof(calculation_parameters) = 'object'),
  configuration_version integer not null default 1 check (configuration_version > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.leave_types (
  id uuid primary key default gen_random_uuid(),
  code text not null check (length(btrim(code)) > 0),
  name text not null check (length(btrim(name)) > 0),
  unit text not null default 'days' check (unit in ('days', 'hours')),
  description text,
  calculation_strategy text not null default 'manual'
    check (calculation_strategy ~ '^[a-z][a-z0-9_]*$'),
  calculation_parameters jsonb not null default '{}'::jsonb
    check (jsonb_typeof(calculation_parameters) = 'object'),
  configuration_version integer not null default 1 check (configuration_version > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.document_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.document_categories (id) on delete restrict,
  code text not null check (length(btrim(code)) > 0),
  name text not null check (length(btrim(name)) > 0),
  description text,
  employee_visible_default boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (parent_id is null or parent_id <> id),
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employee_profiles (id) on delete restrict,
  transaction_type_id uuid not null references public.transaction_types (id) on delete restrict,
  transaction_date date not null,
  reference_number text,
  direction text not null check (direction in ('debit', 'credit')),
  amount numeric not null check (amount >= 0),
  status text not null default 'draft' check (status in ('draft', 'posted', 'voided')),
  description text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employee_profiles (id) on delete restrict,
  loan_type_id uuid not null references public.loan_types (id) on delete restrict,
  account_number text,
  application_date date,
  start_date date not null,
  maturity_date date,
  principal_amount numeric not null check (principal_amount > 0),
  interest_rate numeric check (interest_rate is null or interest_rate >= 0),
  total_payable_amount numeric check (total_payable_amount is null or total_payable_amount >= 0),
  term_count integer check (term_count is null or term_count > 0),
  schedule_method text not null default 'manual' check (schedule_method in ('manual', 'automatic')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paid', 'closed', 'defaulted', 'cancelled')),
  rule_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(rule_snapshot) = 'object'),
  notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (maturity_date is null or maturity_date >= start_date),
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.loan_schedules (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans (id) on delete restrict,
  installment_number integer not null check (installment_number > 0),
  due_date date not null,
  principal_due numeric not null default 0 check (principal_due >= 0),
  interest_due numeric not null default 0 check (interest_due >= 0),
  penalty_due numeric not null default 0 check (penalty_due >= 0),
  other_due numeric not null default 0 check (other_due >= 0),
  total_due numeric not null check (total_due >= 0),
  generation_method text not null default 'manual' check (generation_method in ('manual', 'automatic')),
  status text not null default 'pending'
    check (status in ('pending', 'partially_paid', 'paid', 'waived', 'cancelled')),
  rule_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(rule_snapshot) = 'object'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (total_due = principal_due + interest_due + penalty_due + other_due),
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.loan_payments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans (id) on delete restrict,
  employee_id uuid not null references public.employee_profiles (id) on delete restrict,
  transaction_id uuid unique references public.transactions (id) on delete restrict,
  payment_date date not null,
  amount numeric not null check (amount > 0),
  reference_number text,
  status text not null default 'pending' check (status in ('pending', 'posted', 'reversed')),
  notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.loan_payment_allocations (
  id uuid primary key default gen_random_uuid(),
  loan_payment_id uuid not null references public.loan_payments (id) on delete restrict,
  loan_schedule_id uuid not null references public.loan_schedules (id) on delete restrict,
  allocated_amount numeric not null check (allocated_amount > 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.rebates (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employee_profiles (id) on delete restrict,
  rebate_type_id uuid not null references public.rebate_types (id) on delete restrict,
  loan_id uuid references public.loans (id) on delete restrict,
  transaction_id uuid unique references public.transactions (id) on delete restrict,
  rebate_date date not null,
  amount numeric not null check (amount >= 0),
  status text not null default 'draft' check (status in ('draft', 'approved', 'posted', 'cancelled')),
  rule_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(rule_snapshot) = 'object'),
  reason text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employee_profiles (id) on delete restrict,
  leave_type_id uuid not null references public.leave_types (id) on delete restrict,
  balance numeric not null default 0,
  as_of_date date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.leave_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employee_profiles (id) on delete restrict,
  leave_type_id uuid not null references public.leave_types (id) on delete restrict,
  effective_date date not null,
  entry_kind text not null
    check (entry_kind in ('accrual', 'usage', 'adjustment', 'carryover', 'expiration')),
  quantity_delta numeric not null check (quantity_delta <> 0),
  status text not null default 'posted' check (status in ('posted', 'voided')),
  reference_number text,
  rule_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(rule_snapshot) = 'object'),
  notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employee_profiles (id) on delete restrict,
  document_category_id uuid not null references public.document_categories (id) on delete restrict,
  storage_object_path text not null unique check (length(btrim(storage_object_path)) > 0),
  original_filename text not null check (length(btrim(original_filename)) > 0),
  mime_type text not null check (length(btrim(mime_type)) > 0),
  size_bytes bigint not null check (size_bytes >= 0),
  document_date date,
  is_employee_visible boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'available', 'archived')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  import_type text not null
    check (import_type in ('employees', 'transactions', 'loans', 'loan_schedules', 'rebates', 'leave_records')),
  status text not null default 'queued'
    check (status in ('queued', 'validating', 'ready', 'processing', 'completed', 'completed_with_errors', 'failed', 'cancelled')),
  source_filename text not null check (length(btrim(source_filename)) > 0),
  storage_object_path text,
  total_rows integer not null default 0 check (total_rows >= 0),
  valid_rows integer not null default 0 check (valid_rows >= 0),
  error_rows integer not null default 0 check (error_rows >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  summary jsonb not null default '{}'::jsonb check (jsonb_typeof(summary) = 'object'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (completed_at is null or started_at is null or completed_at >= started_at),
  check (valid_rows + error_rows <= total_rows),
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references public.import_jobs (id) on delete restrict,
  row_number integer not null check (row_number > 0),
  status text not null default 'pending'
    check (status in ('pending', 'valid', 'error', 'imported', 'skipped')),
  source_data jsonb not null default '{}'::jsonb check (jsonb_typeof(source_data) = 'object'),
  normalized_data jsonb check (normalized_data is null or jsonb_typeof(normalized_data) = 'object'),
  target_table text,
  target_record_id uuid,
  error_code text,
  error_message text,
  error_details jsonb check (error_details is null or jsonb_typeof(error_details) = 'object'),
  processed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.system_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique check (setting_key ~ '^[a-z][a-z0-9_.-]*$'),
  setting_value jsonb not null,
  value_schema_version integer not null default 1 check (value_schema_version > 0),
  description text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_profile_id uuid references public.profiles (id) on delete set null,
  action text not null
    check (action in ('create', 'update', 'soft_delete', 'restore', 'import', 'password_reset', 'settings_change')),
  entity_table text not null,
  entity_id text not null,
  old_data jsonb,
  new_data jsonb,
  reason text,
  request_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object')
);

create unique index financial_categories_active_code_uidx on public.financial_categories (lower(code)) where deleted_at is null;
create unique index transaction_types_active_code_uidx on public.transaction_types (lower(code)) where deleted_at is null;
create unique index loan_types_active_code_uidx on public.loan_types (lower(code)) where deleted_at is null;
create unique index rebate_types_active_code_uidx on public.rebate_types (lower(code)) where deleted_at is null;
create unique index leave_types_active_code_uidx on public.leave_types (lower(code)) where deleted_at is null;
create unique index document_categories_active_code_uidx on public.document_categories (lower(code)) where deleted_at is null;
create unique index transactions_active_reference_uidx on public.transactions (reference_number) where reference_number is not null and deleted_at is null;
create unique index loans_active_account_uidx on public.loans (loan_type_id, account_number) where account_number is not null and deleted_at is null;
create unique index loan_schedules_active_installment_uidx on public.loan_schedules (loan_id, installment_number) where deleted_at is null;
create unique index loan_allocations_active_pair_uidx on public.loan_payment_allocations (loan_payment_id, loan_schedule_id) where deleted_at is null;
create unique index leave_balances_active_employee_type_uidx on public.leave_balances (employee_id, leave_type_id) where deleted_at is null;
create unique index import_rows_job_row_uidx on public.import_rows (import_job_id, row_number) where deleted_at is null;

create index transactions_employee_date_cursor_idx on public.transactions (employee_id, transaction_date desc, id desc) where deleted_at is null;
create index transactions_status_date_cursor_idx on public.transactions (status, transaction_date desc, id desc) where deleted_at is null;
create index loans_employee_date_cursor_idx on public.loans (employee_id, start_date desc, id desc) where deleted_at is null;
create index loan_schedules_loan_due_cursor_idx on public.loan_schedules (loan_id, due_date desc, id desc) where deleted_at is null;
create index loan_payments_employee_date_cursor_idx on public.loan_payments (employee_id, payment_date desc, id desc) where deleted_at is null;
create index rebates_employee_date_cursor_idx on public.rebates (employee_id, rebate_date desc, id desc) where deleted_at is null;
create index leave_entries_employee_date_cursor_idx on public.leave_entries (employee_id, effective_date desc, id desc) where deleted_at is null;
create index documents_employee_date_cursor_idx on public.documents (employee_id, document_date desc nulls last, id desc) where deleted_at is null;
create index import_rows_job_cursor_idx on public.import_rows (import_job_id, row_number, id) where deleted_at is null;
create index import_jobs_created_cursor_idx on public.import_jobs (created_at desc, id desc) where deleted_at is null;
create index audit_logs_occurred_cursor_idx on public.audit_logs (occurred_at desc, id desc);

do $$
declare fk record;
begin
  for fk in
    select distinct c.conrelid::regclass::text as table_name, a.attname as column_name
    from pg_constraint c
    cross join lateral unnest(c.conkey) as key(attnum)
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = key.attnum
    join pg_namespace n on n.oid = c.connamespace
    where c.contype = 'f' and n.nspname = 'public'
  loop
    execute format('create index if not exists %I on %s (%I)',
      replace(replace(fk.table_name, 'public.', ''), '"', '') || '_' || fk.column_name || '_fkey_idx',
      fk.table_name,
      fk.column_name);
  end loop;
end
$$;

create function private.set_lifecycle_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
declare actor uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.updated_at := coalesce(new.updated_at, new.created_at);
    new.created_by := coalesce(new.created_by, actor);
    new.updated_by := coalesce(new.updated_by, actor);
  else
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_at := clock_timestamp();
    new.updated_by := coalesce(actor, new.updated_by, old.updated_by);
  end if;

  if new.deleted_at is null then
    new.deleted_by := null;
    new.deletion_reason := null;
  else
    if new.deletion_reason is null or length(btrim(new.deletion_reason)) = 0 then
      raise exception 'A deletion reason is required for soft deletion.' using errcode = '23514';
    end if;
    new.deleted_by := coalesce(new.deleted_by, actor);
  end if;
  return new;
end
$$;

create function private.write_audit_log()
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
begin
  if tg_op = 'INSERT' then
    event_action := 'create';
    after_data := to_jsonb(new);
    record_id := new.id::text;
  else
    before_data := to_jsonb(old);
    after_data := to_jsonb(new);
    record_id := new.id::text;
    event_reason := new.deletion_reason;
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

  insert into public.audit_logs (
    actor_profile_id, action, entity_table, entity_id,
    old_data, new_data, reason
  ) values (
    (select auth.uid()), event_action, tg_table_name, record_id,
    before_data, after_data, event_reason
  );
  return new;
end
$$;

create function private.prevent_hard_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Permanent deletion is not allowed for %. Use soft deletion.', tg_table_name
    using errcode = '42501';
end
$$;

create function private.validate_loan_payment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.loans l
    where l.id = new.loan_id and l.employee_id = new.employee_id and l.deleted_at is null
  ) then
    raise exception 'Loan payment employee must match the loan employee.' using errcode = '23514';
  end if;
  return new;
end
$$;

create function private.validate_loan_allocation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.loan_payments p
    join public.loan_schedules s on s.loan_id = p.loan_id
    where p.id = new.loan_payment_id
      and s.id = new.loan_schedule_id
      and p.deleted_at is null
      and s.deleted_at is null
  ) then
    raise exception 'Payment allocations must reference a schedule for the same loan.' using errcode = '23514';
  end if;
  return new;
end
$$;

create function private.validate_rebate_loan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.loan_id is not null and not exists (
    select 1 from public.loans l
    where l.id = new.loan_id and l.employee_id = new.employee_id and l.deleted_at is null
  ) then
    raise exception 'Rebate employee must match the loan employee.' using errcode = '23514';
  end if;
  return new;
end
$$;

create function private.recalculate_leave_balance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_employee uuid;
  target_type uuid;
  calculated_balance numeric;
  balance_date date;
begin
  target_employee := coalesce(new.employee_id, old.employee_id);
  target_type := coalesce(new.leave_type_id, old.leave_type_id);

  select coalesce(sum(quantity_delta), 0), max(effective_date)
    into calculated_balance, balance_date
  from public.leave_entries
  where employee_id = target_employee
    and leave_type_id = target_type
    and status = 'posted'
    and deleted_at is null;

  insert into public.leave_balances (employee_id, leave_type_id, balance, as_of_date)
  values (target_employee, target_type, calculated_balance, balance_date)
  on conflict (employee_id, leave_type_id) where deleted_at is null
  do update set balance = excluded.balance, as_of_date = excluded.as_of_date;

  if tg_op = 'UPDATE' and (old.employee_id, old.leave_type_id) is distinct from (new.employee_id, new.leave_type_id) then
    select coalesce(sum(quantity_delta), 0), max(effective_date)
      into calculated_balance, balance_date
    from public.leave_entries
    where employee_id = old.employee_id
      and leave_type_id = old.leave_type_id
      and status = 'posted'
      and deleted_at is null;
    update public.leave_balances
      set balance = calculated_balance, as_of_date = balance_date
      where employee_id = old.employee_id and leave_type_id = old.leave_type_id and deleted_at is null;
  end if;
  return new;
end
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','employee_profiles','financial_categories','transaction_types','loan_types',
    'rebate_types','leave_types','document_categories','transactions','loans','loan_schedules',
    'loan_payments','loan_payment_allocations','rebates','leave_balances','leave_entries',
    'documents','import_jobs','import_rows','system_settings'
  ] loop
    execute format('create trigger %I before insert or update on public.%I for each row execute function private.set_lifecycle_fields()', table_name || '_lifecycle', table_name);
    execute format('create trigger %I after insert or update on public.%I for each row execute function private.write_audit_log()', table_name || '_audit', table_name);
    execute format('create trigger %I before delete on public.%I for each row execute function private.prevent_hard_delete()', table_name || '_prevent_delete', table_name);
  end loop;
end
$$;

create trigger loan_payments_validate
before insert or update of loan_id, employee_id on public.loan_payments
for each row execute function private.validate_loan_payment();

create trigger loan_allocations_validate
before insert or update of loan_payment_id, loan_schedule_id on public.loan_payment_allocations
for each row execute function private.validate_loan_allocation();

create trigger rebates_validate_loan
before insert or update of employee_id, loan_id on public.rebates
for each row execute function private.validate_rebate_loan();

create trigger leave_entries_recalculate_balance
after insert or update on public.leave_entries
for each row execute function private.recalculate_leave_balance();

create function private.prevent_audit_log_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Audit logs are append-only.' using errcode = '42501';
end
$$;

create trigger audit_logs_immutable
before update or delete on public.audit_logs
for each row execute function private.prevent_audit_log_changes();

revoke all on schema private from public, anon, authenticated, service_role;
revoke execute on all functions in schema private from public, anon, authenticated, service_role;
