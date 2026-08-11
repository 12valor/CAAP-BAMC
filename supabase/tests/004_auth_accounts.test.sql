begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select no_plan();

select has_table('public', 'account_usernames', 'username mapping table exists');
select has_table('public', 'login_activity', 'login activity table exists');

select is(
  (select count(*)::integer
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname in ('account_usernames', 'login_activity')
     and c.relrowsecurity),
  2,
  'RLS is enabled on both authentication tables'
);

select ok(
  not has_table_privilege('anon', 'public.account_usernames', 'select')
  and not has_table_privilege('authenticated', 'public.account_usernames', 'select'),
  'username mappings are unavailable to browser Data API roles'
);

select ok(
  has_function_privilege('service_role', 'public.bootstrap_first_admin(uuid,text,text,text)', 'execute')
  and not has_function_privilege('authenticated', 'public.bootstrap_first_admin(uuid,text,text,text)', 'execute')
  and has_function_privilege('service_role', 'public.create_employee_account(uuid,uuid,uuid,text,text)', 'execute')
  and not has_function_privilege('authenticated', 'public.create_employee_account(uuid,uuid,uuid,text,text)', 'execute'),
  'trusted account RPCs are executable only by service_role'
);

select ok(
  has_function_privilege('service_role', 'public.set_account_status(uuid,uuid,boolean,text)', 'execute')
  and not has_function_privilege('authenticated', 'public.set_account_status(uuid,uuid,boolean,text)', 'execute')
  and has_function_privilege('service_role', 'public.record_password_reset(uuid,uuid,text,boolean)', 'execute')
  and not has_function_privilege('authenticated', 'public.record_password_reset(uuid,uuid,text,boolean)', 'execute'),
  'security-event RPCs are executable only by service_role'
);

insert into auth.users (
  id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('71000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', '71000000-0000-0000-0000-000000000001@accounts.caap-bamc.invalid', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('72000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', '72000000-0000-0000-0000-000000000001@accounts.caap-bamc.invalid', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

set local role service_role;
select lives_ok(
  $$select public.bootstrap_first_admin(
    '71000000-0000-0000-0000-000000000001',
    'phase3.admin',
    '71000000-0000-0000-0000-000000000001@accounts.caap-bamc.invalid',
    'Phase 3 Admin'
  )$$,
  'service role can bootstrap the first administrator'
);
reset role;

insert into public.employee_profiles (
  id, employee_number, first_name, last_name, created_by, updated_by
)
values (
  '72000000-0000-0000-0000-000000000002', 'PHASE3-EMP',
  'Phase', 'Employee',
  '71000000-0000-0000-0000-000000000001',
  '71000000-0000-0000-0000-000000000001'
);

set local role service_role;
select lives_ok(
  $$select public.create_employee_account(
    '71000000-0000-0000-0000-000000000001',
    '72000000-0000-0000-0000-000000000002',
    '72000000-0000-0000-0000-000000000001',
    'phase3.employee',
    '72000000-0000-0000-0000-000000000001@accounts.caap-bamc.invalid'
  )$$,
  'service role can atomically attach an employee account'
);
reset role;

select is(
  (select profile_id from public.employee_profiles
   where id = '72000000-0000-0000-0000-000000000002'),
  '72000000-0000-0000-0000-000000000001'::uuid,
  'employee account creation links the existing employee record'
);

select is(
  (select role from public.profiles
   where id = '72000000-0000-0000-0000-000000000001'),
  'employee',
  'employee account receives the canonical employee role'
);

select ok(
  not exists (
    select 1 from public.audit_logs
    where entity_table = 'account_usernames'
      and new_data ? 'internal_auth_identifier'
  ),
  'audit entries redact internal Auth identifiers'
);

set local role service_role;
select lives_ok(
  $$select public.set_account_status(
    '71000000-0000-0000-0000-000000000001',
    '72000000-0000-0000-0000-000000000001',
    false,
    'Phase 3 account status test'
  )$$,
  'service role can disable an employee account through the guarded RPC'
);
select lives_ok(
  $$select public.set_account_status(
    '71000000-0000-0000-0000-000000000001',
    '72000000-0000-0000-0000-000000000001',
    true,
    'Phase 3 account status restore test'
  )$$,
  'service role can re-enable an employee account through the guarded RPC'
);
select lives_ok(
  $$select public.record_password_reset(
    '71000000-0000-0000-0000-000000000001',
    '72000000-0000-0000-0000-000000000001',
    'Phase 3 password reset test',
    true
  )$$,
  'service role records password resets without password contents'
);
reset role;

select ok(
  exists (
    select 1 from public.audit_logs
    where action = 'password_reset'
      and entity_id = '72000000-0000-0000-0000-000000000001'
      and old_data is null
      and new_data is null
  ),
  'password reset audit entries contain no password snapshots'
);

set local role service_role;
insert into public.login_activity (
  profile_id, username_fingerprint, network_fingerprint, outcome, user_agent
) values (
  '72000000-0000-0000-0000-000000000001',
  repeat('a', 64), repeat('b', 64), 'success', 'pgTAP Phase 3'
);
reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"72000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;
select is(
  (select count(*)::integer from public.login_activity),
  0,
  'employees cannot read login activity'
);
select throws_ok(
  $$select * from public.account_usernames$$,
  '42501', null,
  'employees cannot query username mappings'
);
reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"71000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;
select is(
  (select count(*)::integer from public.login_activity),
  1,
  'administrators can review login activity'
);
select throws_ok(
  $$update public.login_activity set outcome = 'logout' where id = 1$$,
  '42501', null,
  'administrators cannot modify login activity'
);
reset role;

select throws_ok(
  $$delete from public.login_activity$$,
  '42501', null,
  'login activity is append-only even for table owners'
);

select throws_ok(
  $$delete from public.account_usernames$$,
  '42501', null,
  'account mappings reject permanent deletion'
);

select * from finish();
rollback;
