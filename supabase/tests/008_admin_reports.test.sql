begin;
create extension if not exists pgtap with schema extensions;
set local search_path=extensions,public,pg_catalog;
select no_plan();
select has_column('public','audit_logs','subject_employee_id','audit entries carry an indexed employee subject');
select has_index('public','audit_logs','audit_logs_subject_cursor_idx','employee audit cursor index exists');
select has_index('public','audit_logs','audit_logs_actor_cursor_idx','actor audit cursor index exists');
select has_function('public','get_admin_dashboard_summary',array['date','date'],'admin dashboard aggregate exists');
select ok(not has_function_privilege('anon','public.get_admin_dashboard_summary(date,date)','execute'),'anonymous callers cannot execute admin reports');
select ok(has_function_privilege('authenticated','public.get_admin_dashboard_summary(date,date)','execute'),'authenticated role reaches the identity-checked admin endpoint');

insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('88000000-0000-0000-0000-000000000001','authenticated','authenticated','phase11-admin@example.test',now(),'{}','{}',now(),now()),
('88000000-0000-0000-0000-000000000002','authenticated','authenticated','phase11-employee@example.test',now(),'{}','{}',now(),now());
insert into public.profiles(id,role,display_name) values
('88000000-0000-0000-0000-000000000001','admin','Phase 11 Admin'),
('88000000-0000-0000-0000-000000000002','employee','Phase 11 Employee');
insert into public.employee_profiles(id,profile_id,employee_number,first_name,last_name) values
('88000000-0000-0000-0000-000000000010','88000000-0000-0000-0000-000000000002','P11-001','Report','Employee');

set local role authenticated;
select set_config('request.jwt.claim.sub','88000000-0000-0000-0000-000000000002',true);
select throws_ok($$select public.get_admin_dashboard_summary(null,null)$$,'42501','Administrator access required.','employees cannot retrieve admin summaries');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','88000000-0000-0000-0000-000000000001',true);
select ok((public.get_admin_dashboard_summary('2026-08-01','2026-08-31')->'employees'->>'total')::integer >= 1,'admin receives the dashboard aggregate');
reset role;

insert into public.audit_logs(action,entity_table,entity_id,new_data) values('create','transactions','88000000-0000-0000-0000-000000000099',jsonb_build_object('employee_id','88000000-0000-0000-0000-000000000010','amount','0.10'));
select is((select subject_employee_id from public.audit_logs where entity_id='88000000-0000-0000-0000-000000000099'),'88000000-0000-0000-0000-000000000010'::uuid,'audit trigger assigns the employee subject');
select throws_ok($$update public.audit_logs set reason='changed' where entity_id='88000000-0000-0000-0000-000000000099'$$,'42501','Audit logs are append-only.','audit entries remain immutable');
select * from finish();
rollback;
