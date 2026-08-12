begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select no_plan();

select has_column('public', 'employee_profiles', 'employment_category', 'employee category is available');
select has_column('public', 'transactions', 'attachment_document_id', 'ledger supports attachment links');
select has_table('public', 'interest_methods', 'interest methods are configurable rows');
select has_table('public', 'penalty_rules', 'penalty rules are configurable rows');
select has_table('public', 'loan_adjustments', 'loan adjustment explanations are retained');
select results_eq(
  $$select code from public.loan_types where code in ('EL','GL','MPL') and deleted_at is null order by code$$,
  array['EL','GL','MPL']::text[], 'GL, MPL, and EL remain editable reference rows'
);
select throws_ok(
  $$insert into public.interest_methods (code, name, strategy) values ('BAD', 'Executable formula', 'javascript')$$,
  '23514', null, 'strategies reject arbitrary executable formulas'
);
select throws_ok($$delete from public.loan_types where code = 'GL'$$, '42501', null, 'settings cannot be hard-deleted');
select is(
  (select count(*)::integer from information_schema.routine_privileges where specific_schema = 'public' and routine_name in ('manage_employee_record','manage_ledger_transaction','manage_loan_record') and grantee = 'authenticated'),
  0, 'browser roles cannot execute trusted workflow RPCs directly'
);
select * from finish();
rollback;
