-- Remote migration version: 20260811122521
revoke all privileges on all tables in schema public from anon, authenticated, service_role;
revoke all privileges on all sequences in schema public from anon, authenticated, service_role;
revoke all privileges on all functions in schema public from public, anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;

revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.status = 'active'
        and p.deleted_at is null
    );
$$;

create function private.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select ep.id
  from public.employee_profiles ep
  join public.profiles p on p.id = ep.profile_id
  where p.id = (select auth.uid())
    and p.role = 'employee'
    and p.status = 'active'
    and p.deleted_at is null
    and ep.deleted_at is null
  limit 1;
$$;

revoke execute on function private.is_admin() from public, anon, authenticated, service_role;
revoke execute on function private.current_employee_id() from public, anon, authenticated, service_role;
grant usage on schema private to authenticated, service_role;
grant execute on function private.is_admin(), private.current_employee_id() to authenticated, service_role;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','employee_profiles','financial_categories','transaction_types','transactions',
    'loan_types','loans','loan_schedules','loan_payments','loan_payment_allocations',
    'rebate_types','rebates','leave_types','leave_balances','leave_entries',
    'document_categories','documents','import_jobs','import_rows','audit_logs','system_settings'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','employee_profiles','financial_categories','transaction_types','transactions',
    'loan_types','loans','loan_schedules','loan_payments','loan_payment_allocations',
    'rebate_types','rebates','leave_types','leave_balances','leave_entries',
    'document_categories','documents','import_jobs','import_rows','system_settings'
  ] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select private.is_admin()))',
      table_name || '_admin_select', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.is_admin()))',
      table_name || '_admin_insert', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))',
      table_name || '_admin_update', table_name
    );
  end loop;
end
$$;

create policy audit_logs_admin_select
on public.audit_logs for select to authenticated
using ((select private.is_admin()));

create policy profiles_employee_select
on public.profiles for select to authenticated
using (id = (select auth.uid()) and status = 'active' and deleted_at is null);

create policy employee_profiles_employee_select
on public.employee_profiles for select to authenticated
using (profile_id = (select auth.uid()) and deleted_at is null);

create policy financial_categories_employee_select
on public.financial_categories for select to authenticated
using (is_active and deleted_at is null and (select private.current_employee_id()) is not null);

create policy transaction_types_employee_select
on public.transaction_types for select to authenticated
using (is_active and deleted_at is null and (select private.current_employee_id()) is not null);

create policy loan_types_employee_select
on public.loan_types for select to authenticated
using (is_active and deleted_at is null and (select private.current_employee_id()) is not null);

create policy rebate_types_employee_select
on public.rebate_types for select to authenticated
using (is_active and deleted_at is null and (select private.current_employee_id()) is not null);

create policy leave_types_employee_select
on public.leave_types for select to authenticated
using (is_active and deleted_at is null and (select private.current_employee_id()) is not null);

create policy document_categories_employee_select
on public.document_categories for select to authenticated
using (is_active and deleted_at is null and (select private.current_employee_id()) is not null);

create policy transactions_employee_select
on public.transactions for select to authenticated
using (employee_id = (select private.current_employee_id()) and deleted_at is null);

create policy loans_employee_select
on public.loans for select to authenticated
using (employee_id = (select private.current_employee_id()) and deleted_at is null);

create policy loan_schedules_employee_select
on public.loan_schedules for select to authenticated
using (
  deleted_at is null and exists (
    select 1 from public.loans l
    where l.id = loan_id
      and l.employee_id = (select private.current_employee_id())
      and l.deleted_at is null
  )
);

create policy loan_payments_employee_select
on public.loan_payments for select to authenticated
using (employee_id = (select private.current_employee_id()) and deleted_at is null);

create policy loan_payment_allocations_employee_select
on public.loan_payment_allocations for select to authenticated
using (
  deleted_at is null and exists (
    select 1 from public.loan_payments p
    where p.id = loan_payment_id
      and p.employee_id = (select private.current_employee_id())
      and p.deleted_at is null
  )
);

create policy rebates_employee_select
on public.rebates for select to authenticated
using (employee_id = (select private.current_employee_id()) and deleted_at is null);

create policy leave_balances_employee_select
on public.leave_balances for select to authenticated
using (employee_id = (select private.current_employee_id()) and deleted_at is null);

create policy leave_entries_employee_select
on public.leave_entries for select to authenticated
using (employee_id = (select private.current_employee_id()) and deleted_at is null);

create policy documents_employee_select
on public.documents for select to authenticated
using (
  employee_id = (select private.current_employee_id())
  and is_employee_visible
  and status = 'available'
  and deleted_at is null
);

grant usage on schema public to authenticated, service_role;

grant select on table
  public.profiles,
  public.employee_profiles,
  public.financial_categories,
  public.transaction_types,
  public.transactions,
  public.loan_types,
  public.loans,
  public.loan_schedules,
  public.loan_payments,
  public.loan_payment_allocations,
  public.rebate_types,
  public.rebates,
  public.leave_types,
  public.leave_balances,
  public.leave_entries,
  public.document_categories,
  public.documents,
  public.import_jobs,
  public.import_rows,
  public.audit_logs,
  public.system_settings
to authenticated;

grant insert, update on table
  public.profiles,
  public.employee_profiles,
  public.financial_categories,
  public.transaction_types,
  public.transactions,
  public.loan_types,
  public.loans,
  public.loan_schedules,
  public.loan_payments,
  public.loan_payment_allocations,
  public.rebate_types,
  public.rebates,
  public.leave_types,
  public.leave_entries,
  public.document_categories,
  public.documents,
  public.import_jobs,
  public.import_rows,
  public.system_settings
to authenticated;

grant select, insert, update on table
  public.profiles,
  public.employee_profiles,
  public.financial_categories,
  public.transaction_types,
  public.transactions,
  public.loan_types,
  public.loans,
  public.loan_schedules,
  public.loan_payments,
  public.loan_payment_allocations,
  public.rebate_types,
  public.rebates,
  public.leave_types,
  public.leave_balances,
  public.leave_entries,
  public.document_categories,
  public.documents,
  public.import_jobs,
  public.import_rows,
  public.system_settings
to service_role;

grant select, insert on table public.audit_logs to service_role;
grant usage, select on sequence public.audit_logs_id_seq to service_role;

notify pgrst, 'reload schema';
