create table public.interest_methods (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code ~ '^[A-Z][A-Z0-9_-]*$'),
  name text not null check (length(btrim(name)) > 0),
  strategy text not null default 'manual'
    check (strategy in ('manual', 'zero_interest', 'flat_percentage')),
  default_rate numeric check (default_rate is null or default_rate >= 0),
  description text,
  is_active boolean not null default true,
  effective_from date,
  effective_to date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (effective_to is null or effective_from is null or effective_to >= effective_from),
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create table public.penalty_rules (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code ~ '^[A-Z][A-Z0-9_-]*$'),
  name text not null check (length(btrim(name)) > 0),
  strategy text not null default 'none'
    check (strategy in ('none', 'fixed_amount', 'percentage')),
  fixed_amount numeric check (fixed_amount is null or fixed_amount >= 0),
  percentage_rate numeric check (percentage_rate is null or percentage_rate >= 0),
  grace_days integer not null default 0 check (grace_days >= 0),
  cap_amount numeric check (cap_amount is null or cap_amount >= 0),
  description text,
  is_active boolean not null default true,
  effective_from date,
  effective_to date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz, deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,
  check (effective_to is null or effective_from is null or effective_to >= effective_from),
  check (
    (strategy = 'none' and fixed_amount is null and percentage_rate is null)
    or (strategy = 'fixed_amount' and fixed_amount is not null and percentage_rate is null)
    or (strategy = 'percentage' and percentage_rate is not null and fixed_amount is null)
  ),
  check (deleted_at is not null or (deleted_by is null and deletion_reason is null))
);

create unique index interest_methods_active_code_uidx
  on public.interest_methods (lower(code)) where deleted_at is null;
create unique index penalty_rules_active_code_uidx
  on public.penalty_rules (lower(code)) where deleted_at is null;

alter table public.financial_categories
  add column balance_effect text not null default 'neutral'
    check (balance_effect in ('increase', 'decrease', 'neutral')),
  add column effective_from date,
  add column effective_to date,
  add constraint financial_categories_effective_dates_check
    check (effective_to is null or effective_from is null or effective_to >= effective_from);

alter table public.transaction_types
  add column balance_effect text not null default 'increase',
  add column effective_from date,
  add column effective_to date,
  add column reference_strategy text not null default 'manual'
    check (reference_strategy in ('manual', 'sequence')),
  add column reference_prefix text,
  add column reference_padding integer not null default 6
    check (reference_padding between 3 and 12),
  add column reference_reset text not null default 'yearly'
    check (reference_reset in ('never', 'yearly')),
  add constraint transaction_types_balance_effect_check check (
    (direction = 'debit' and balance_effect = 'increase')
    or (direction = 'credit' and balance_effect = 'decrease')
  ),
  add constraint transaction_types_effective_dates_check
    check (effective_to is null or effective_from is null or effective_to >= effective_from);

alter table public.loan_types
  add column interest_method_id uuid references public.interest_methods (id) on delete restrict,
  add column penalty_rule_id uuid references public.penalty_rules (id) on delete restrict,
  add column default_rate numeric check (default_rate is null or default_rate >= 0),
  add column default_term_count integer check (default_term_count is null or default_term_count > 0),
  add column installment_frequency text not null default 'manual'
    check (installment_frequency in ('manual', 'weekly', 'semi_monthly', 'monthly', 'quarterly')),
  add column rounding_method text not null default 'half_up'
    check (rounding_method in ('half_up', 'down', 'up')),
  add column effective_from date,
  add column effective_to date,
  add constraint loan_types_effective_dates_check
    check (effective_to is null or effective_from is null or effective_to >= effective_from);

alter table public.rebate_types
  add column fixed_amount numeric check (fixed_amount is null or fixed_amount >= 0),
  add column percentage_rate numeric check (percentage_rate is null or percentage_rate >= 0),
  add column balance_effect text not null default 'neutral'
    check (balance_effect in ('increase', 'decrease', 'neutral')),
  add column transaction_type_id uuid references public.transaction_types (id) on delete restrict,
  add column rounding_method text not null default 'half_up'
    check (rounding_method in ('half_up', 'down', 'up')),
  add column effective_from date,
  add column effective_to date,
  add constraint rebate_types_strategy_check
    check (calculation_strategy in ('manual', 'fixed_amount', 'percentage')),
  add constraint rebate_types_values_check check (
    (calculation_strategy = 'manual')
    or (calculation_strategy = 'fixed_amount' and fixed_amount is not null)
    or (calculation_strategy = 'percentage' and percentage_rate is not null)
  ),
  add constraint rebate_types_effective_dates_check
    check (effective_to is null or effective_from is null or effective_to >= effective_from);

alter table public.transactions
  add column attachment_document_id uuid references public.documents (id) on delete restrict;
alter table public.transactions drop constraint transactions_amount_check;
alter table public.transactions add constraint transactions_amount_check check (amount > 0);

create index loan_types_interest_method_id_fkey_idx on public.loan_types (interest_method_id);
create index loan_types_penalty_rule_id_fkey_idx on public.loan_types (penalty_rule_id);
create index rebate_types_transaction_type_id_fkey_idx on public.rebate_types (transaction_type_id);
create index transactions_attachment_document_id_fkey_idx on public.transactions (attachment_document_id);
create index transaction_types_effective_idx
  on public.transaction_types (is_active, effective_from, effective_to) where deleted_at is null;

create table private.transaction_reference_sequences (
  transaction_type_id uuid not null references public.transaction_types (id) on delete restrict,
  sequence_year integer not null,
  next_value bigint not null default 1 check (next_value > 0),
  primary key (transaction_type_id, sequence_year)
);

create trigger interest_methods_lifecycle before insert or update on public.interest_methods
for each row execute function private.set_lifecycle_fields();
create trigger interest_methods_audit after insert or update on public.interest_methods
for each row execute function private.write_audit_log();
create trigger interest_methods_prevent_delete before delete on public.interest_methods
for each row execute function private.prevent_hard_delete();

create trigger penalty_rules_lifecycle before insert or update on public.penalty_rules
for each row execute function private.set_lifecycle_fields();
create trigger penalty_rules_audit after insert or update on public.penalty_rules
for each row execute function private.write_audit_log();
create trigger penalty_rules_prevent_delete before delete on public.penalty_rules
for each row execute function private.prevent_hard_delete();

create function private.validate_transaction_configuration()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  configured_direction text;
  document_employee_id uuid;
begin
  select tt.direction into configured_direction
  from public.transaction_types tt
  where tt.id = new.transaction_type_id and tt.deleted_at is null;
  if configured_direction is null or configured_direction <> new.direction then
    raise exception 'Transaction direction must match its configured type.' using errcode = '23514';
  end if;

  if new.attachment_document_id is not null then
    select d.employee_id into document_employee_id
    from public.documents d
    where d.id = new.attachment_document_id and d.deleted_at is null;
    if document_employee_id is null or document_employee_id <> new.employee_id then
      raise exception 'Transaction attachments must belong to the same employee.' using errcode = '23514';
    end if;
  end if;
  return new;
end
$$;

create trigger transactions_validate_configuration
before insert or update of employee_id, transaction_type_id, direction, attachment_document_id
on public.transactions
for each row execute function private.validate_transaction_configuration();

create function private.issue_transaction_reference(type_id uuid, business_date date)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  strategy text;
  prefix text;
  padding integer;
  reset_method text;
  reference_year integer;
  issued_value bigint;
begin
  select reference_strategy, nullif(btrim(reference_prefix), ''), reference_padding, reference_reset
  into strategy, prefix, padding, reset_method
  from public.transaction_types
  where id = type_id and deleted_at is null;

  if strategy is distinct from 'sequence' then
    return null;
  end if;

  reference_year := case when reset_method = 'yearly' then extract(year from business_date)::integer else 0 end;
  insert into private.transaction_reference_sequences (transaction_type_id, sequence_year, next_value)
  values (type_id, reference_year, 2)
  on conflict (transaction_type_id, sequence_year)
  do update set next_value = private.transaction_reference_sequences.next_value + 1
  returning next_value - 1 into issued_value;

  return concat(
    coalesce(prefix || '-', ''),
    case when reset_method = 'yearly' then reference_year::text || '-' else '' end,
    lpad(issued_value::text, padding, '0')
  );
end
$$;

create function public.manage_ledger_transaction(
  actor_profile_id uuid,
  operation text,
  transaction_record_id uuid default null,
  payload jsonb default '{}'::jsonb,
  change_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid := transaction_record_id;
  configured_direction text;
  configured_active boolean;
  effective_from date;
  effective_to date;
  business_date date;
  issued_reference text;
begin
  perform private.assert_admin_actor(actor_profile_id);
  if jsonb_typeof(payload) <> 'object' then
    raise exception 'Transaction payload must be a JSON object.' using errcode = '22023';
  end if;

  if operation in ('create', 'update') then
    business_date := (payload->>'transaction_date')::date;
    select tt.direction, tt.is_active, tt.effective_from, tt.effective_to
    into configured_direction, configured_active, effective_from, effective_to
    from public.transaction_types tt
    where tt.id = (payload->>'transaction_type_id')::uuid and tt.deleted_at is null;
    if configured_direction is null then
      raise exception 'Transaction type was not found.' using errcode = 'P0002';
    end if;
    if operation = 'create' and (
      not configured_active
      or (effective_from is not null and business_date < effective_from)
      or (effective_to is not null and business_date > effective_to)
    ) then
      raise exception 'Transaction type is not active for this date.' using errcode = '23514';
    end if;
    if (payload->>'amount')::numeric <= 0 then
      raise exception 'Transaction amount must be positive.' using errcode = '23514';
    end if;
  end if;

  if operation = 'create' then
    issued_reference := coalesce(
      nullif(btrim(payload->>'reference_number'), ''),
      private.issue_transaction_reference((payload->>'transaction_type_id')::uuid, business_date)
    );
    perform set_config('app.audit_reason', coalesce(nullif(btrim(change_reason), ''), 'Ledger transaction created'), true);
    insert into public.transactions (
      employee_id, transaction_type_id, transaction_date, reference_number,
      direction, amount, status, description, attachment_document_id,
      created_by, updated_by
    ) values (
      (payload->>'employee_id')::uuid, (payload->>'transaction_type_id')::uuid,
      business_date, issued_reference, configured_direction,
      (payload->>'amount')::numeric, coalesce(nullif(payload->>'status', ''), 'posted'),
      nullif(btrim(payload->>'description'), ''),
      nullif(payload->>'attachment_document_id', '')::uuid,
      actor_profile_id, actor_profile_id
    ) returning id into target_id;
  elsif operation = 'update' then
    if target_id is null or change_reason is null or length(btrim(change_reason)) < 5 then
      raise exception 'Transaction updates require a record and reason.' using errcode = '22023';
    end if;
    perform set_config('app.audit_reason', btrim(change_reason), true);
    update public.transactions set
      employee_id = (payload->>'employee_id')::uuid,
      transaction_type_id = (payload->>'transaction_type_id')::uuid,
      transaction_date = business_date,
      reference_number = nullif(btrim(payload->>'reference_number'), ''),
      direction = configured_direction,
      amount = (payload->>'amount')::numeric,
      status = payload->>'status',
      description = nullif(btrim(payload->>'description'), ''),
      attachment_document_id = nullif(payload->>'attachment_document_id', '')::uuid,
      updated_by = actor_profile_id
    where id = target_id and deleted_at is null;
    if not found then raise exception 'Transaction was not found.' using errcode = 'P0002'; end if;
  elsif operation = 'soft_delete' then
    if target_id is null or change_reason is null or length(btrim(change_reason)) < 5 then
      raise exception 'Soft deletion requires a record and reason.' using errcode = '22023';
    end if;
    perform set_config('app.audit_reason', btrim(change_reason), true);
    update public.transactions set deleted_at = clock_timestamp(), deleted_by = actor_profile_id,
      deletion_reason = btrim(change_reason), updated_by = actor_profile_id
    where id = target_id and deleted_at is null;
    if not found then raise exception 'Transaction was not found.' using errcode = 'P0002'; end if;
  elsif operation = 'restore' then
    if target_id is null or change_reason is null or length(btrim(change_reason)) < 5 then
      raise exception 'Restore requires a record and reason.' using errcode = '22023';
    end if;
    perform set_config('app.audit_reason', btrim(change_reason), true);
    update public.transactions set deleted_at = null, deleted_by = null, deletion_reason = null,
      updated_by = actor_profile_id
    where id = target_id and deleted_at is not null;
    if not found then raise exception 'Archived transaction was not found.' using errcode = 'P0002'; end if;
  else
    raise exception 'Unsupported transaction operation.' using errcode = '22023';
  end if;
  return target_id;
end
$$;

create function public.get_admin_transaction_page(
  actor_profile_id uuid,
  search_query text default null,
  employee_filter uuid default null,
  transaction_type_filter uuid default null,
  date_from date default null,
  date_to date default null,
  include_archived boolean default false,
  cursor_date date default null,
  cursor_id uuid default null,
  page_size integer default 25
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  perform private.assert_admin_actor(actor_profile_id);
  with filtered as (
    select
      t.id, t.employee_id, t.transaction_type_id, t.transaction_date,
      t.reference_number, t.direction, t.amount, t.status, t.description,
      t.attachment_document_id, t.deleted_at,
      concat_ws(' ', ep.first_name, nullif(ep.middle_name, ''), ep.last_name, nullif(ep.suffix, '')) as employee_name,
      ep.employee_number, tt.name as transaction_type_name, fc.name as category_name,
      sum(case when t.direction = 'debit' then t.amount else -t.amount end)
        over (order by t.transaction_date, t.id rows unbounded preceding) as running_balance
    from public.transactions t
    join public.employee_profiles ep on ep.id = t.employee_id
    join public.transaction_types tt on tt.id = t.transaction_type_id
    join public.financial_categories fc on fc.id = tt.financial_category_id
    where (include_archived or t.deleted_at is null)
      and (employee_filter is null or t.employee_id = employee_filter)
      and (transaction_type_filter is null or t.transaction_type_id = transaction_type_filter)
      and (date_from is null or t.transaction_date >= date_from)
      and (date_to is null or t.transaction_date <= date_to)
      and (
        search_query is null or btrim(search_query) = ''
        or t.reference_number ilike '%' || btrim(search_query) || '%'
        or t.description ilike '%' || btrim(search_query) || '%'
        or ep.employee_number ilike '%' || btrim(search_query) || '%'
        or ep.search_text ilike '%' || lower(btrim(search_query)) || '%'
      )
  ), totals as (
    select
      coalesce(sum(amount) filter (where direction = 'debit'), 0) as debit_total,
      coalesce(sum(amount) filter (where direction = 'credit'), 0) as credit_total,
      coalesce(sum(case when direction = 'debit' then amount else -amount end), 0) as net_balance
    from filtered
  ), page_rows as (
    select * from filtered
    where cursor_date is null or cursor_id is null or (transaction_date, id) < (cursor_date, cursor_id)
    order by transaction_date desc, id desc
    limit least(greatest(page_size, 1), 500) + 1
  )
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(to_jsonb(p) order by p.transaction_date desc, p.id desc) from page_rows p), '[]'::jsonb),
    'debit_total', totals.debit_total,
    'credit_total', totals.credit_total,
    'net_balance', totals.net_balance
  ) into result from totals;
  return result;
end
$$;

alter table public.interest_methods enable row level security;
alter table public.penalty_rules enable row level security;

create policy interest_methods_authenticated_select on public.interest_methods
for select to authenticated using (
  (select private.is_admin())
  or (is_active and deleted_at is null and (select private.current_employee_id()) is not null)
);
create policy interest_methods_admin_insert on public.interest_methods
for insert to authenticated with check ((select private.is_admin()));
create policy interest_methods_admin_update on public.interest_methods
for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy penalty_rules_authenticated_select on public.penalty_rules
for select to authenticated using (
  (select private.is_admin())
  or (is_active and deleted_at is null and (select private.current_employee_id()) is not null)
);
create policy penalty_rules_admin_insert on public.penalty_rules
for insert to authenticated with check ((select private.is_admin()));
create policy penalty_rules_admin_update on public.penalty_rules
for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

grant select, insert, update on public.interest_methods, public.penalty_rules to authenticated, service_role;
revoke execute on function private.validate_transaction_configuration() from public, anon, authenticated, service_role;
revoke execute on function private.issue_transaction_reference(uuid, date) from public, anon, authenticated, service_role;
revoke execute on function public.manage_ledger_transaction(uuid, text, uuid, jsonb, text) from public, anon, authenticated;
revoke execute on function public.get_admin_transaction_page(uuid, text, uuid, uuid, date, date, boolean, date, uuid, integer) from public, anon, authenticated;
grant execute on function public.manage_ledger_transaction(uuid, text, uuid, jsonb, text) to service_role;
grant execute on function public.get_admin_transaction_page(uuid, text, uuid, uuid, date, date, boolean, date, uuid, integer) to service_role;

insert into public.financial_categories (
  code, name, description, balance_effect, is_active, sort_order
)
select 'DEBIT', 'Debit entries', 'Editable category for positive debit ledger entries.', 'increase', true, 10
where not exists (
  select 1 from public.financial_categories where lower(code) = 'debit' and deleted_at is null
);
insert into public.financial_categories (
  code, name, description, balance_effect, is_active, sort_order
)
select 'CREDIT', 'Credit entries', 'Editable category for positive credit ledger entries.', 'decrease', true, 20
where not exists (
  select 1 from public.financial_categories where lower(code) = 'credit' and deleted_at is null
);
insert into public.transaction_types (
  financial_category_id, code, name, direction, balance_effect,
  description, is_active, sort_order, reference_strategy
)
select fc.id, 'MANUAL_DEBIT', 'Manual debit', 'debit', 'increase',
  'Bookkeeper-entered debit with an explicit positive amount.', true, 10, 'manual'
from public.financial_categories fc
where fc.code = 'DEBIT' and fc.deleted_at is null
  and not exists (
    select 1 from public.transaction_types where lower(code) = 'manual_debit' and deleted_at is null
  );
insert into public.transaction_types (
  financial_category_id, code, name, direction, balance_effect,
  description, is_active, sort_order, reference_strategy
)
select fc.id, 'MANUAL_CREDIT', 'Manual credit', 'credit', 'decrease',
  'Bookkeeper-entered credit with an explicit positive amount.', true, 20, 'manual'
from public.financial_categories fc
where fc.code = 'CREDIT' and fc.deleted_at is null
  and not exists (
    select 1 from public.transaction_types where lower(code) = 'manual_credit' and deleted_at is null
  );

notify pgrst, 'reload schema';


