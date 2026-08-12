begin;
create extension if not exists pgtap with schema extensions;
set local search_path=extensions,public,pg_catalog;
select no_plan();
select has_function('public','confirm_import_job',array['uuid'],'atomic import confirmation function exists');
select ok(not has_function_privilege('authenticated','public.confirm_import_job(uuid)','execute') and has_function_privilege('service_role','public.confirm_import_job_as_admin(uuid,uuid)','execute'),'import confirmation is exposed only to the trusted server role');
select has_function('public','get_my_financial_overview',array[]::text[],'employee overview function exists');
select has_function('public','get_my_statement',array['date','date','uuid','uuid'],'employee statement function exists');
select ok(not has_function_privilege('anon','public.get_my_statement(date,date,uuid,uuid)','execute'),'anonymous users cannot generate statements');
select ok(has_function_privilege('authenticated','public.get_my_statement(date,date,uuid,uuid)','execute'),'authenticated employees can call the identity-derived statement function');
select ok(not exists(select 1 from information_schema.parameters where specific_schema='public' and specific_name like 'get_my_statement_%' and parameter_name ilike '%employee%'),'statement function does not accept an employee identifier');
select ok(exists(select 1 from pg_indexes where schemaname='public' and indexname='import_jobs_completed_digest_uidx' and indexdef ilike '%where%'),'repeated completed imports are protected by a partial digest index');
select ok(pg_get_functiondef('public.confirm_import_job(uuid)'::regprocedure) like '%record_loan_payment%','loan payment imports reuse the atomic ledger-linked payment workflow');

insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('87000000-0000-0000-0000-000000000001','authenticated','authenticated','import-admin@example.test',now(),'{}','{}',now(),now());
insert into public.profiles(id,role,display_name) values('87000000-0000-0000-0000-000000000001','admin','Import Admin');
insert into public.import_jobs(id,import_type,status,source_filename,source_digest,total_rows,valid_rows,error_rows,created_by,updated_by)
values
('87000000-0000-0000-0000-000000000011','workbook','validating','invalid.xlsx','digest-invalid',1,0,1,'87000000-0000-0000-0000-000000000001','87000000-0000-0000-0000-000000000001'),
('87000000-0000-0000-0000-000000000012','workbook','ready','linked.xlsx','digest-linked',2,2,0,'87000000-0000-0000-0000-000000000001','87000000-0000-0000-0000-000000000001');
insert into public.import_rows(import_job_id,row_number,entity_type,status,source_data,normalized_data,created_by,updated_by) values
('87000000-0000-0000-0000-000000000012',1,'employees','valid','{"redacted":true}','{"employee_number":"ROLLBACK-EMP","first_name":"Rollback","last_name":"Employee","employment_status":"active"}','87000000-0000-0000-0000-000000000001','87000000-0000-0000-0000-000000000001'),
('87000000-0000-0000-0000-000000000012',2,'transactions','valid','{"redacted":true}','{"employee_number":"ROLLBACK-EMP","type_code":"DOES_NOT_EXIST","date":"2026-08-12","direction":"debit","amount":"10.25"}','87000000-0000-0000-0000-000000000001','87000000-0000-0000-0000-000000000001');

set local role service_role;
select set_config('request.jwt.claim.sub','87000000-0000-0000-0000-000000000001',true);
select throws_ok($$select public.confirm_import_job('87000000-0000-0000-0000-000000000011')$$,'22023','Only a ready, error-free import can be confirmed.','invalid rows block confirmation');
select throws_ok($$select public.confirm_import_job('87000000-0000-0000-0000-000000000012')$$,'23514','Transaction direction must match its configured type.','a failed linked record aborts confirmation');
reset role;
select is((select count(*)::integer from public.employee_profiles where employee_number='ROLLBACK-EMP'),0,'atomic confirmation rolls back earlier rows when a linked record fails');

insert into public.import_jobs(import_type,status,source_filename,source_digest,total_rows,valid_rows,error_rows,created_by,updated_by)
values('workbook','completed','first.xlsx','repeat-digest',0,0,0,'87000000-0000-0000-0000-000000000001','87000000-0000-0000-0000-000000000001');
select throws_ok($$insert into public.import_jobs(import_type,status,source_filename,source_digest,total_rows,valid_rows,error_rows,created_by,updated_by) values('workbook','completed','repeat.xlsx','repeat-digest',0,0,0,'87000000-0000-0000-0000-000000000001','87000000-0000-0000-0000-000000000001')$$,'23505',null,'repeated completed workbook digests are rejected');
select * from finish();
rollback;
