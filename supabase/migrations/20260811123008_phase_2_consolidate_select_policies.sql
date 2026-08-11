-- Remote migration version: 20260811123008
-- Consolidate authenticated SELECT policies so PostgreSQL evaluates one
-- permissive policy per table and action instead of separate admin/employee
-- policies. This preserves the same authorization behavior.
do $migration$
declare
  policy_record record;
begin
  for policy_record in
    select * from (values
      ('profiles', 'id = (select auth.uid()) and status = ''active'' and deleted_at is null'),
      ('employee_profiles', 'profile_id = (select auth.uid()) and deleted_at is null'),
      ('financial_categories', 'is_active and deleted_at is null and (select private.current_employee_id()) is not null'),
      ('transaction_types', 'is_active and deleted_at is null and (select private.current_employee_id()) is not null'),
      ('loan_types', 'is_active and deleted_at is null and (select private.current_employee_id()) is not null'),
      ('rebate_types', 'is_active and deleted_at is null and (select private.current_employee_id()) is not null'),
      ('leave_types', 'is_active and deleted_at is null and (select private.current_employee_id()) is not null'),
      ('document_categories', 'is_active and deleted_at is null and (select private.current_employee_id()) is not null'),
      ('transactions', 'employee_id = (select private.current_employee_id()) and deleted_at is null'),
      ('loans', 'employee_id = (select private.current_employee_id()) and deleted_at is null'),
      ('loan_schedules', 'deleted_at is null and exists (select 1 from public.loans l where l.id = loan_id and l.employee_id = (select private.current_employee_id()) and l.deleted_at is null)'),
      ('loan_payments', 'employee_id = (select private.current_employee_id()) and deleted_at is null'),
      ('loan_payment_allocations', 'deleted_at is null and exists (select 1 from public.loan_payments p where p.id = loan_payment_id and p.employee_id = (select private.current_employee_id()) and p.deleted_at is null)'),
      ('rebates', 'employee_id = (select private.current_employee_id()) and deleted_at is null'),
      ('leave_balances', 'employee_id = (select private.current_employee_id()) and deleted_at is null'),
      ('leave_entries', 'employee_id = (select private.current_employee_id()) and deleted_at is null'),
      ('documents', 'employee_id = (select private.current_employee_id()) and is_employee_visible and status = ''available'' and deleted_at is null')
    ) as policies(table_name, employee_predicate)
  loop
    execute format('drop policy %I on public.%I', policy_record.table_name || '_admin_select', policy_record.table_name);
    execute format('drop policy %I on public.%I', policy_record.table_name || '_employee_select', policy_record.table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select private.is_admin()) or (%s))',
      policy_record.table_name || '_access_select',
      policy_record.table_name,
      policy_record.employee_predicate
    );
  end loop;
end
$migration$;

notify pgrst, 'reload schema';
