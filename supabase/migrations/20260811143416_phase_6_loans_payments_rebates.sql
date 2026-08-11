alter table public.loan_types
  add constraint loan_types_supported_strategy_check
    check (calculation_strategy in ('manual', 'zero_interest', 'flat_percentage'));

alter table public.loans
  add column interest_method_id uuid references public.interest_methods (id) on delete restrict,
  add column penalty_rule_id uuid references public.penalty_rules (id) on delete restrict,
  add column installment_frequency text not null default 'manual'
    check (installment_frequency in ('manual', 'weekly', 'semi_monthly', 'monthly', 'quarterly')),
  add column rounding_method text not null default 'half_up'
    check (rounding_method in ('half_up', 'down', 'up')),
  add column calculation_source text not null default 'manual'
    check (calculation_source in ('manual', 'system')),
  add column calculation_preview jsonb not null default '{}'::jsonb
    check (jsonb_typeof(calculation_preview) = 'object');

alter table public.loans drop constraint loans_status_check;
alter table public.loans add constraint loans_status_check
  check (status in ('draft', 'active', 'paid', 'completed', 'closed', 'defaulted', 'cancelled'));

alter table public.loan_schedules
  add column paid_amount numeric not null default 0,
  add constraint loan_schedules_paid_amount_check check (paid_amount >= 0 and paid_amount <= total_due);
alter table public.loan_schedules drop constraint loan_schedules_status_check;
alter table public.loan_schedules add constraint loan_schedules_status_check
  check (status in ('pending', 'partially_paid', 'paid', 'overdue', 'waived', 'cancelled'));

alter table public.rebates
  add column calculation_source text not null default 'manual'
    check (calculation_source in ('manual', 'system')),
  add column calculated_amount numeric check (calculated_amount is null or calculated_amount >= 0),
  add column override_reason text;
alter table public.rebates drop constraint rebates_amount_check;
alter table public.rebates add constraint rebates_amount_check check (amount > 0);
alter table public.rebates add constraint rebates_override_reason_check check (
  calculated_amount is null or amount = calculated_amount
  or (override_reason is not null and length(btrim(override_reason)) >= 5)
);

create table public.loan_adjustments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans (id) on delete restrict,
  loan_schedule_id uuid not null references public.loan_schedules (id) on delete restrict,
  adjustment_field text not null
    check (adjustment_field in ('principal', 'interest', 'penalty', 'other')),
  amount_delta numeric not null check (amount_delta <> 0),
  explanation text not null check (length(btrim(explanation)) >= 5),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create index loans_interest_method_id_fkey_idx on public.loans (interest_method_id);
create index loans_penalty_rule_id_fkey_idx on public.loans (penalty_rule_id);
create index loan_adjustments_loan_id_fkey_idx on public.loan_adjustments (loan_id);
create index loan_adjustments_schedule_id_fkey_idx on public.loan_adjustments (loan_schedule_id);
create index loan_adjustments_created_by_fkey_idx on public.loan_adjustments (created_by);
create index loan_adjustments_updated_by_fkey_idx on public.loan_adjustments (updated_by);
create index loan_adjustments_deleted_by_fkey_idx on public.loan_adjustments (deleted_by);
create index loan_adjustments_loan_date_cursor_idx
  on public.loan_adjustments (loan_id, created_at desc, id desc) where deleted_at is null;

create trigger loan_adjustments_lifecycle before insert or update on public.loan_adjustments
for each row execute function private.set_lifecycle_fields();
create trigger loan_adjustments_audit after insert or update on public.loan_adjustments
for each row execute function private.write_audit_log();
create trigger loan_adjustments_prevent_delete before delete on public.loan_adjustments
for each row execute function private.prevent_hard_delete();

create function private.validate_loan_adjustment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.loan_schedules s
    where s.id = new.loan_schedule_id and s.loan_id = new.loan_id and s.deleted_at is null
  ) then
    raise exception 'Loan adjustment schedule must belong to the loan.' using errcode = '23514';
  end if;
  return new;
end
$$;

create trigger loan_adjustments_validate before insert or update on public.loan_adjustments
for each row execute function private.validate_loan_adjustment();

create function public.manage_loan_record(
  actor_profile_id uuid,
  operation text,
  loan_record_id uuid default null,
  payload jsonb default '{}'::jsonb,
  schedule_rows jsonb default '[]'::jsonb,
  change_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid := loan_record_id;
  schedule_row jsonb;
  schedule_sum numeric := 0;
  loan_type_active boolean;
begin
  perform private.assert_admin_actor(actor_profile_id);
  if jsonb_typeof(payload) <> 'object' or jsonb_typeof(schedule_rows) <> 'array' then
    raise exception 'Loan payload and schedule must use structured JSON.' using errcode = '22023';
  end if;

  if operation in ('create', 'update') then
    select is_active into loan_type_active from public.loan_types
    where id = (payload->>'loan_type_id')::uuid and deleted_at is null;
    if loan_type_active is distinct from true then
      raise exception 'Loan type is unavailable.' using errcode = '23514';
    end if;
    if (payload->>'principal_amount')::numeric <= 0 then
      raise exception 'Loan principal must be positive.' using errcode = '23514';
    end if;
  end if;

  if operation = 'create' then
    if (payload->>'schedule_method') = 'automatic' and jsonb_array_length(schedule_rows) = 0 then
      raise exception 'Automatic loans require a generated schedule.' using errcode = '23514';
    end if;
    perform set_config('app.audit_reason', coalesce(nullif(btrim(change_reason), ''), 'Loan created'), true);
    insert into public.loans (
      employee_id, loan_type_id, account_number, application_date, start_date,
      maturity_date, principal_amount, interest_rate, total_payable_amount,
      term_count, schedule_method, installment_frequency, interest_method_id,
      penalty_rule_id, rounding_method, calculation_source, calculation_preview,
      status, rule_snapshot, notes, created_by, updated_by
    ) values (
      (payload->>'employee_id')::uuid, (payload->>'loan_type_id')::uuid,
      nullif(btrim(payload->>'account_number'), ''), nullif(payload->>'application_date', '')::date,
      (payload->>'start_date')::date, nullif(payload->>'maturity_date', '')::date,
      (payload->>'principal_amount')::numeric, nullif(payload->>'interest_rate', '')::numeric,
      nullif(payload->>'total_payable_amount', '')::numeric, nullif(payload->>'term_count', '')::integer,
      payload->>'schedule_method', payload->>'installment_frequency',
      nullif(payload->>'interest_method_id', '')::uuid, nullif(payload->>'penalty_rule_id', '')::uuid,
      payload->>'rounding_method', payload->>'calculation_source',
      coalesce(payload->'calculation_preview', '{}'::jsonb),
      coalesce(nullif(payload->>'status', ''), 'active'),
      coalesce(payload->'rule_snapshot', '{}'::jsonb), nullif(btrim(payload->>'notes'), ''),
      actor_profile_id, actor_profile_id
    ) returning id into target_id;

    for schedule_row in select value from jsonb_array_elements(schedule_rows) loop
      if (schedule_row->>'principal_due')::numeric < 0
        or (schedule_row->>'interest_due')::numeric < 0
        or (schedule_row->>'penalty_due')::numeric < 0
        or (schedule_row->>'other_due')::numeric < 0 then
        raise exception 'Schedule amounts cannot be negative.' using errcode = '23514';
      end if;
      insert into public.loan_schedules (
        loan_id, installment_number, due_date, principal_due, interest_due,
        penalty_due, other_due, total_due, generation_method, status,
        rule_snapshot, created_by, updated_by
      ) values (
        target_id, (schedule_row->>'installment_number')::integer,
        (schedule_row->>'due_date')::date, (schedule_row->>'principal_due')::numeric,
        (schedule_row->>'interest_due')::numeric, (schedule_row->>'penalty_due')::numeric,
        (schedule_row->>'other_due')::numeric, (schedule_row->>'total_due')::numeric,
        payload->>'schedule_method', 'pending',
        coalesce(schedule_row->'rule_snapshot', payload->'rule_snapshot', '{}'::jsonb),
        actor_profile_id, actor_profile_id
      );
      schedule_sum := schedule_sum + (schedule_row->>'total_due')::numeric;
    end loop;
    if jsonb_array_length(schedule_rows) > 0 then
      update public.loans set total_payable_amount = schedule_sum, updated_by = actor_profile_id
      where id = target_id;
    end if;
  elsif operation = 'update' then
    if target_id is null or change_reason is null or length(btrim(change_reason)) < 5 then
      raise exception 'Loan updates require a record and reason.' using errcode = '22023';
    end if;
    perform set_config('app.audit_reason', btrim(change_reason), true);
    update public.loans set
      employee_id = (payload->>'employee_id')::uuid,
      loan_type_id = (payload->>'loan_type_id')::uuid,
      account_number = nullif(btrim(payload->>'account_number'), ''),
      application_date = nullif(payload->>'application_date', '')::date,
      start_date = (payload->>'start_date')::date,
      maturity_date = nullif(payload->>'maturity_date', '')::date,
      principal_amount = (payload->>'principal_amount')::numeric,
      interest_rate = nullif(payload->>'interest_rate', '')::numeric,
      term_count = nullif(payload->>'term_count', '')::integer,
      installment_frequency = payload->>'installment_frequency',
      interest_method_id = nullif(payload->>'interest_method_id', '')::uuid,
      penalty_rule_id = nullif(payload->>'penalty_rule_id', '')::uuid,
      rounding_method = payload->>'rounding_method',
      status = payload->>'status', notes = nullif(btrim(payload->>'notes'), ''),
      updated_by = actor_profile_id
    where id = target_id and deleted_at is null;
    if not found then raise exception 'Loan was not found.' using errcode = 'P0002'; end if;
  elsif operation = 'cancel' then
    if target_id is null or change_reason is null or length(btrim(change_reason)) < 5 then
      raise exception 'Loan cancellation requires a reason.' using errcode = '22023';
    end if;
    perform set_config('app.audit_reason', btrim(change_reason), true);
    update public.loans set status = 'cancelled', notes = concat_ws(E'\n', notes, 'Cancellation: ' || btrim(change_reason)),
      updated_by = actor_profile_id
    where id = target_id and deleted_at is null and status not in ('completed', 'closed', 'cancelled');
    if not found then raise exception 'Loan cannot be cancelled.' using errcode = '23514'; end if;
    update public.loan_schedules set status = 'cancelled', updated_by = actor_profile_id
    where loan_id = target_id and deleted_at is null and status not in ('paid', 'waived');
  else
    raise exception 'Unsupported loan operation.' using errcode = '22023';
  end if;
  return target_id;
end
$$;

create function public.replace_loan_schedule(
  actor_profile_id uuid,
  loan_record_id uuid,
  p_schedule_method text,
  schedule_rows jsonb,
  change_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare schedule_row jsonb; schedule_sum numeric := 0;
begin
  perform private.assert_admin_actor(actor_profile_id);
  if change_reason is null or length(btrim(change_reason)) < 5 or jsonb_typeof(schedule_rows) <> 'array'
    or jsonb_array_length(schedule_rows) = 0 then
    raise exception 'Schedule replacement requires rows and a reason.' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.loan_payment_allocations a
    join public.loan_schedules s on s.id = a.loan_schedule_id
    where s.loan_id = loan_record_id and a.deleted_at is null
  ) then
    raise exception 'A schedule with payment allocations cannot be replaced.' using errcode = '23514';
  end if;
  perform set_config('app.audit_reason', btrim(change_reason), true);
  update public.loan_schedules set deleted_at = clock_timestamp(), deleted_by = actor_profile_id,
    deletion_reason = btrim(change_reason), updated_by = actor_profile_id
  where loan_id = loan_record_id and deleted_at is null;
  for schedule_row in select value from jsonb_array_elements(schedule_rows) loop
    insert into public.loan_schedules (
      loan_id, installment_number, due_date, principal_due, interest_due,
      penalty_due, other_due, total_due, generation_method, status,
      rule_snapshot, created_by, updated_by
    ) values (
      loan_record_id, (schedule_row->>'installment_number')::integer,
      (schedule_row->>'due_date')::date, (schedule_row->>'principal_due')::numeric,
      (schedule_row->>'interest_due')::numeric, (schedule_row->>'penalty_due')::numeric,
      (schedule_row->>'other_due')::numeric, (schedule_row->>'total_due')::numeric,
      p_schedule_method, 'pending', coalesce(schedule_row->'rule_snapshot', '{}'::jsonb),
      actor_profile_id, actor_profile_id
    );
    schedule_sum := schedule_sum + (schedule_row->>'total_due')::numeric;
  end loop;
  update public.loans set schedule_method = p_schedule_method,
    total_payable_amount = schedule_sum, updated_by = actor_profile_id
  where id = loan_record_id and deleted_at is null;
  if not found then raise exception 'Loan was not found.' using errcode = 'P0002'; end if;
end
$$;

create function public.record_loan_payment(
  actor_profile_id uuid,
  loan_record_id uuid,
  payment_date date,
  payment_amount numeric,
  transaction_type_id uuid,
  reference_number text default null,
  payment_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  employee_record_id uuid;
  payment_id uuid;
  ledger_id uuid;
  remaining numeric := payment_amount;
  outstanding numeric;
  schedule_record record;
  allocation numeric;
begin
  perform private.assert_admin_actor(actor_profile_id);
  if payment_amount <= 0 then raise exception 'Payment amount must be positive.' using errcode = '23514'; end if;
  select employee_id into employee_record_id from public.loans
  where id = loan_record_id and deleted_at is null and status in ('active', 'draft');
  if not found then raise exception 'Active loan was not found.' using errcode = 'P0002'; end if;
  select coalesce(sum(total_due - paid_amount), 0) into outstanding
  from public.loan_schedules where loan_id = loan_record_id and deleted_at is null
    and status not in ('waived', 'cancelled');
  if payment_amount > outstanding then
    raise exception 'Payment exceeds the outstanding scheduled balance.' using errcode = '23514';
  end if;
  if not exists (
    select 1 from public.transaction_types where id = transaction_type_id
      and direction = 'credit' and is_active and deleted_at is null
  ) then
    raise exception 'Loan payments require an active credit transaction type.' using errcode = '23514';
  end if;

  ledger_id := public.manage_ledger_transaction(
    actor_profile_id, 'create', null,
    jsonb_build_object(
      'employee_id', employee_record_id, 'transaction_type_id', transaction_type_id,
      'transaction_date', payment_date, 'amount', payment_amount::text,
      'reference_number', reference_number, 'description', coalesce(payment_notes, 'Loan payment'),
      'status', 'posted', 'attachment_document_id', null
    ), 'Loan payment posted'
  );
  perform set_config('app.audit_reason', 'Loan payment posted', true);
  insert into public.loan_payments (
    loan_id, employee_id, transaction_id, payment_date, amount,
    reference_number, status, notes, created_by, updated_by
  ) values (
    loan_record_id, employee_record_id, ledger_id, payment_date, payment_amount,
    nullif(btrim(reference_number), ''), 'posted', nullif(btrim(payment_notes), ''),
    actor_profile_id, actor_profile_id
  ) returning id into payment_id;

  for schedule_record in
    select id, total_due, paid_amount from public.loan_schedules
    where loan_id = loan_record_id and deleted_at is null
      and status not in ('paid', 'waived', 'cancelled')
    order by due_date, installment_number
    for update
  loop
    exit when remaining <= 0;
    allocation := least(remaining, schedule_record.total_due - schedule_record.paid_amount);
    if allocation > 0 then
      insert into public.loan_payment_allocations (
        loan_payment_id, loan_schedule_id, allocated_amount, created_by, updated_by
      ) values (payment_id, schedule_record.id, allocation, actor_profile_id, actor_profile_id);
      update public.loan_schedules set
        paid_amount = paid_amount + allocation,
        status = case
          when paid_amount + allocation >= total_due then 'paid'
          when paid_amount + allocation > 0 then 'partially_paid'
          when due_date < current_date then 'overdue'
          else 'pending'
        end,
        updated_by = actor_profile_id
      where id = schedule_record.id;
      remaining := remaining - allocation;
    end if;
  end loop;
  if remaining <> 0 then raise exception 'Payment could not be fully allocated.' using errcode = '23514'; end if;
  if not exists (
    select 1 from public.loan_schedules where loan_id = loan_record_id and deleted_at is null
      and status not in ('paid', 'waived', 'cancelled')
  ) then
    update public.loans set status = 'completed', updated_by = actor_profile_id where id = loan_record_id;
  end if;
  return payment_id;
end
$$;

create function public.adjust_loan_schedule(
  actor_profile_id uuid,
  loan_schedule_record_id uuid,
  adjustment_field text,
  amount_delta numeric,
  explanation text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare loan_record_id uuid; adjustment_id uuid;
begin
  perform private.assert_admin_actor(actor_profile_id);
  if adjustment_field not in ('principal', 'interest', 'penalty', 'other')
    or amount_delta = 0 or explanation is null or length(btrim(explanation)) < 5 then
    raise exception 'A valid adjustment and explanation are required.' using errcode = '22023';
  end if;
  select loan_id into loan_record_id from public.loan_schedules
  where id = loan_schedule_record_id and deleted_at is null and status not in ('paid', 'waived', 'cancelled')
  for update;
  if not found then raise exception 'Adjustable schedule was not found.' using errcode = 'P0002'; end if;
  perform set_config('app.audit_reason', btrim(explanation), true);
  update public.loan_schedules set
    principal_due = principal_due + case when adjustment_field = 'principal' then amount_delta else 0 end,
    interest_due = interest_due + case when adjustment_field = 'interest' then amount_delta else 0 end,
    penalty_due = penalty_due + case when adjustment_field = 'penalty' then amount_delta else 0 end,
    other_due = other_due + case when adjustment_field = 'other' then amount_delta else 0 end,
    total_due = total_due + amount_delta,
    status = case when paid_amount > 0 then 'partially_paid' when due_date < current_date then 'overdue' else 'pending' end,
    updated_by = actor_profile_id
  where id = loan_schedule_record_id
    and principal_due + case when adjustment_field = 'principal' then amount_delta else 0 end >= 0
    and interest_due + case when adjustment_field = 'interest' then amount_delta else 0 end >= 0
    and penalty_due + case when adjustment_field = 'penalty' then amount_delta else 0 end >= 0
    and other_due + case when adjustment_field = 'other' then amount_delta else 0 end >= 0
    and total_due + amount_delta >= paid_amount;
  if not found then raise exception 'Adjustment would create an invalid schedule amount.' using errcode = '23514'; end if;
  insert into public.loan_adjustments (
    loan_id, loan_schedule_id, adjustment_field, amount_delta, explanation,
    created_by, updated_by
  ) values (
    loan_record_id, loan_schedule_record_id, adjustment_field, amount_delta,
    btrim(explanation), actor_profile_id, actor_profile_id
  ) returning id into adjustment_id;
  update public.loans set total_payable_amount = (
    select coalesce(sum(total_due), 0) from public.loan_schedules
    where loan_id = loan_record_id and deleted_at is null and status <> 'cancelled'
  ), updated_by = actor_profile_id where id = loan_record_id;
  return adjustment_id;
end
$$;

create function public.create_rebate_record(
  actor_profile_id uuid,
  employee_record_id uuid,
  rebate_type_record_id uuid,
  rebate_date date,
  rebate_amount numeric,
  calculation_source text,
  calculated_amount numeric default null,
  override_reason text default null,
  loan_record_id uuid default null,
  reference_number text default null,
  rebate_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  rebate_id uuid;
  ledger_id uuid;
  configured_effect text;
  configured_transaction_type uuid;
  configured_strategy text;
  configured_parameters jsonb;
begin
  perform private.assert_admin_actor(actor_profile_id);
  if rebate_amount <= 0 or calculation_source not in ('manual', 'system') then
    raise exception 'Rebate amount and calculation source are invalid.' using errcode = '23514';
  end if;
  select balance_effect, transaction_type_id, calculation_strategy, calculation_parameters
  into configured_effect, configured_transaction_type, configured_strategy, configured_parameters
  from public.rebate_types
  where id = rebate_type_record_id and is_active and deleted_at is null
    and (effective_from is null or rebate_date >= effective_from)
    and (effective_to is null or rebate_date <= effective_to);
  if not found then raise exception 'Rebate type is unavailable for this date.' using errcode = 'P0002'; end if;
  if calculation_source = 'system' and calculated_amount is null then
    raise exception 'System-calculated rebates require a calculated amount.' using errcode = '23514';
  end if;
  if calculated_amount is not null and rebate_amount <> calculated_amount
    and (override_reason is null or length(btrim(override_reason)) < 5) then
    raise exception 'A manual override reason is required.' using errcode = '23514';
  end if;
  if loan_record_id is not null and not exists (
    select 1 from public.loans where id = loan_record_id and employee_id = employee_record_id and deleted_at is null
  ) then
    raise exception 'Rebate loan must belong to the employee.' using errcode = '23514';
  end if;
  if configured_effect <> 'neutral' then
    if configured_transaction_type is null then
      raise exception 'Ledger-affecting rebate types require a transaction type.' using errcode = '23514';
    end if;
    ledger_id := public.manage_ledger_transaction(
      actor_profile_id, 'create', null,
      jsonb_build_object(
        'employee_id', employee_record_id, 'transaction_type_id', configured_transaction_type,
        'transaction_date', rebate_date, 'amount', rebate_amount::text,
        'reference_number', reference_number, 'description', coalesce(rebate_reason, 'Rebate'),
        'status', 'posted', 'attachment_document_id', null
      ), 'Rebate posted to ledger'
    );
  end if;
  perform set_config('app.audit_reason', coalesce(nullif(btrim(rebate_reason), ''), 'Rebate recorded'), true);
  insert into public.rebates (
    employee_id, rebate_type_id, loan_id, transaction_id, rebate_date, amount,
    status, rule_snapshot, reason, calculation_source, calculated_amount,
    override_reason, created_by, updated_by
  ) values (
    employee_record_id, rebate_type_record_id, loan_record_id, ledger_id,
    rebate_date, rebate_amount, 'posted',
    jsonb_build_object('strategy', configured_strategy, 'parameters', configured_parameters),
    nullif(btrim(rebate_reason), ''), calculation_source, calculated_amount,
    nullif(btrim(override_reason), ''), actor_profile_id, actor_profile_id
  ) returning id into rebate_id;
  return rebate_id;
end
$$;

alter table public.loan_adjustments enable row level security;
create policy loan_adjustments_authenticated_select on public.loan_adjustments
for select to authenticated using (
  (select private.is_admin())
  or (
    deleted_at is null and exists (
      select 1 from public.loans l where l.id = loan_id
        and l.employee_id = (select private.current_employee_id()) and l.deleted_at is null
    )
  )
);
create policy loan_adjustments_admin_insert on public.loan_adjustments
for insert to authenticated with check ((select private.is_admin()));
create policy loan_adjustments_admin_update on public.loan_adjustments
for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

grant select, insert, update on public.loan_adjustments to authenticated, service_role;
revoke execute on function private.validate_loan_adjustment() from public, anon, authenticated, service_role;
revoke execute on function public.manage_loan_record(uuid, text, uuid, jsonb, jsonb, text) from public, anon, authenticated;
revoke execute on function public.replace_loan_schedule(uuid, uuid, text, jsonb, text) from public, anon, authenticated;
revoke execute on function public.record_loan_payment(uuid, uuid, date, numeric, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.adjust_loan_schedule(uuid, uuid, text, numeric, text) from public, anon, authenticated;
revoke execute on function public.create_rebate_record(uuid, uuid, uuid, date, numeric, text, numeric, text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.manage_loan_record(uuid, text, uuid, jsonb, jsonb, text) to service_role;
grant execute on function public.replace_loan_schedule(uuid, uuid, text, jsonb, text) to service_role;
grant execute on function public.record_loan_payment(uuid, uuid, date, numeric, uuid, text, text) to service_role;
grant execute on function public.adjust_loan_schedule(uuid, uuid, text, numeric, text) to service_role;
grant execute on function public.create_rebate_record(uuid, uuid, uuid, date, numeric, text, numeric, text, uuid, text, text) to service_role;

insert into public.interest_methods (code, name, strategy, description, is_active)
select 'MANUAL', 'Manual interest', 'manual', 'Bookkeeper enters approved values; no automatic formula is applied.', true
where not exists (select 1 from public.interest_methods where lower(code) = 'manual' and deleted_at is null);
insert into public.interest_methods (code, name, strategy, default_rate, description, is_active)
select 'ZERO', 'Zero interest', 'zero_interest', 0, 'Principal is divided across the configured term.', true
where not exists (select 1 from public.interest_methods where lower(code) = 'zero' and deleted_at is null);
insert into public.interest_methods (code, name, strategy, description, is_active)
select 'FLAT', 'Flat percentage', 'flat_percentage', 'Total interest is principal multiplied by the explicitly configured rate.', true
where not exists (select 1 from public.interest_methods where lower(code) = 'flat' and deleted_at is null);
insert into public.penalty_rules (code, name, strategy, description, is_active)
select 'NONE', 'No automatic penalty', 'none', 'Penalty values remain zero unless manually adjusted with an explanation.', true
where not exists (select 1 from public.penalty_rules where lower(code) = 'none' and deleted_at is null);

update public.loan_types set
  interest_method_id = (select id from public.interest_methods where code = 'MANUAL' and deleted_at is null limit 1),
  penalty_rule_id = (select id from public.penalty_rules where code = 'NONE' and deleted_at is null limit 1),
  installment_frequency = 'manual', calculation_strategy = 'manual', updated_at = clock_timestamp()
where code in ('GL', 'MPL', 'EL') and deleted_at is null;

notify pgrst, 'reload schema';
