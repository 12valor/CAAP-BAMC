begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select no_plan();

select is(
  (select count(*)::integer from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
      and table_name in (
        'profiles','employee_profiles','financial_categories','transaction_types','transactions',
        'loan_types','loans','loan_schedules','loan_payments','loan_payment_allocations',
        'rebate_types','rebates','leave_types','leave_balances','leave_entries',
        'document_categories','documents','import_jobs','import_rows','audit_logs','system_settings'
      )),
  21,
  'all Phase 2 tables exist'
);

select is(
  (select count(*)::integer
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'profiles','employee_profiles','financial_categories','transaction_types','transactions',
     'loan_types','loans','loan_schedules','loan_payments','loan_payment_allocations',
     'rebate_types','rebates','leave_types','leave_balances','leave_entries',
     'document_categories','documents','import_jobs','import_rows','audit_logs','system_settings'
   ) and c.relrowsecurity),
  21,
  'RLS is enabled on every exposed table'
);

select col_type_is('public', 'transactions', 'amount', 'numeric', 'transaction money is exact numeric');
select col_type_is('public', 'loans', 'principal_amount', 'numeric', 'loan money is exact numeric');
select col_type_is('public', 'audit_logs', 'occurred_at', 'timestamp with time zone', 'audit time uses timestamptz');

select is(
  (select count(*)::integer from information_schema.role_table_grants
   where grantee = 'anon' and table_schema = 'public'),
  0,
  'anonymous receives no public table grants'
);

select is(
  (select count(*)::integer from information_schema.role_table_grants
   where grantee = 'authenticated' and table_schema = 'public' and privilege_type = 'DELETE'),
  0,
  'authenticated receives no permanent-delete grants'
);

select ok(
  not has_function_privilege('anon', 'public.rls_auto_enable()', 'execute'),
  'anonymous cannot execute the RLS event-trigger function'
);

select ok(
  not has_table_privilege('authenticated', 'public.audit_logs', 'insert')
  and not has_table_privilege('authenticated', 'public.audit_logs', 'update')
  and not has_table_privilege('authenticated', 'public.audit_logs', 'delete'),
  'normal application users cannot mutate audit logs'
);

select is(
  (select count(*)::integer
   from pg_constraint c
   cross join lateral unnest(c.conkey) as key(attnum)
   join pg_attribute a on a.attrelid = c.conrelid and a.attnum = key.attnum
   join pg_namespace n on n.oid = c.connamespace
   where c.contype = 'f' and n.nspname = 'public'
     and not exists (
       select 1 from pg_index i
       where i.indrelid = c.conrelid and key.attnum = any(i.indkey)
     )),
  0,
  'every foreign-key column is indexed'
);

select ok(
  (select count(*) from pg_indexes
   where schemaname = 'public' and indexdef ilike '%where (deleted_at is null)%') >= 10,
  'active-row partial indexes exclude soft-deleted records'
);

select results_eq(
  $$select code from public.loan_types where deleted_at is null order by sort_order$$,
  array['GL','MPL','EL']::text[],
  'GL, MPL, and EL are editable reference rows'
);

select is(
  (select count(*)::integer from public.loan_types
   where code in ('GL','MPL','EL')
     and calculation_strategy = 'manual'
     and calculation_parameters = '{}'::jsonb),
  3,
  'seed loan types use structured manual configuration'
);

select is(
  (select count(*)::integer
   from (
     select schemaname, tablename, cmd, roles
     from pg_policies
     where schemaname = 'public' and permissive = 'PERMISSIVE'
     group by schemaname, tablename, cmd, roles
     having count(*) > 1
   ) duplicated_policies),
  0,
  'each role and action has at most one permissive policy per table'
);

select * from finish();
rollback;
