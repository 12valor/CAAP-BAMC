begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select no_plan();

insert into public.employee_profiles (id, employee_number, first_name, last_name)
values
  ('70000000-0000-0000-0000-000000000001', 'PHASE2-INTEGRITY-A', 'Integrity', 'A'),
  ('70000000-0000-0000-0000-000000000002', 'PHASE2-INTEGRITY-B', 'Integrity', 'B');
insert into public.financial_categories (id, code, name)
values ('70000000-0000-0000-0000-000000000003', 'INT-CAT', 'Integrity Category');
insert into public.transaction_types (id, financial_category_id, code, name, direction)
values ('70000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000003', 'INT-TXN', 'Integrity Transaction', 'debit');
insert into public.transactions (id, employee_id, transaction_type_id, transaction_date, direction, amount)
values ('70000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000004', current_date, 'debit', 1234567890.123456789);

select is(
  (select amount from public.transactions where id = '70000000-0000-0000-0000-000000000005'),
  1234567890.123456789::numeric,
  'money retains exact decimal precision'
);

select throws_ok(
  $$insert into public.transactions (employee_id, transaction_type_id, transaction_date, direction, amount) values ('70000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000004', current_date, 'sideways', 1)$$,
  '23514',
  null,
  'transaction direction is constrained'
);

select throws_ok(
  $$update public.transactions set deleted_at = now() where id = '70000000-0000-0000-0000-000000000005'$$,
  '23514',
  null,
  'soft deletion requires a reason'
);

select lives_ok(
  $$update public.transactions set description = 'changed' where id = '70000000-0000-0000-0000-000000000005'$$,
  'normal updates are audited'
);
select lives_ok(
  $$update public.transactions set deleted_at = now(), deletion_reason = 'test deletion' where id = '70000000-0000-0000-0000-000000000005'$$,
  'soft deletion succeeds with a reason'
);
select lives_ok(
  $$update public.transactions set deleted_at = null where id = '70000000-0000-0000-0000-000000000005'$$,
  'soft-deleted records can be restored'
);

select results_eq(
  $$select action from public.audit_logs where entity_table = 'transactions' and entity_id = '70000000-0000-0000-0000-000000000005' order by id$$,
  array['create','update','soft_delete','restore']::text[],
  'create, update, soft-delete, and restore are append-only audit events'
);

insert into public.leave_types (id, code, name)
values ('70000000-0000-0000-0000-000000000006', 'INT-LEAVE', 'Integrity Leave');
insert into public.leave_entries (employee_id, leave_type_id, effective_date, entry_kind, quantity_delta)
values
  ('70000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000006', current_date - 1, 'accrual', 5.5),
  ('70000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000006', current_date, 'usage', -1.25);

select is(
  (select balance from public.leave_balances where employee_id = '70000000-0000-0000-0000-000000000001' and leave_type_id = '70000000-0000-0000-0000-000000000006' and deleted_at is null),
  4.25::numeric,
  'leave balance is maintained from posted ledger deltas'
);

insert into public.loans (id, employee_id, loan_type_id, start_date, principal_amount)
values
  ('70000000-0000-0000-0000-000000000007', '70000000-0000-0000-0000-000000000001', (select id from public.loan_types where code = 'GL'), current_date, 100),
  ('70000000-0000-0000-0000-000000000008', '70000000-0000-0000-0000-000000000002', (select id from public.loan_types where code = 'MPL'), current_date, 100);
insert into public.loan_schedules (id, loan_id, installment_number, due_date, principal_due, total_due)
values ('70000000-0000-0000-0000-000000000009', '70000000-0000-0000-0000-000000000008', 1, current_date, 100, 100);
insert into public.loan_payments (id, loan_id, employee_id, payment_date, amount)
values ('70000000-0000-0000-0000-000000000010', '70000000-0000-0000-0000-000000000007', '70000000-0000-0000-0000-000000000001', current_date, 50);

select throws_ok(
  $$insert into public.loan_payment_allocations (loan_payment_id, loan_schedule_id, allocated_amount) values ('70000000-0000-0000-0000-000000000010', '70000000-0000-0000-0000-000000000009', 50)$$,
  '23514',
  null,
  'payment allocations cannot cross loans'
);

select throws_ok(
  $$delete from public.transactions where id = '70000000-0000-0000-0000-000000000005'$$,
  '42501',
  null,
  'hard deletion is rejected even for privileged database operations'
);

select throws_ok(
  $$update public.audit_logs set reason = 'tamper' where entity_table = 'transactions'$$,
  '42501',
  null,
  'audit rows are immutable'
);

select * from finish();
rollback;
