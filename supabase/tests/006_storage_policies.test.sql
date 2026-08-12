begin;
create extension if not exists pgtap with schema extensions;
set local search_path=extensions,public,storage,pg_catalog;
select no_plan();
select is((select public from storage.buckets where id='employee-documents'),false,'employee document bucket is private');
select is((select file_size_limit from storage.buckets where id='employee-documents'),52428800::bigint,'bucket has a fixed hard size limit');
select ok((select allowed_mime_types @> array['application/pdf','image/jpeg','image/png']::text[] from storage.buckets where id='employee-documents'),'bucket permits only supported document MIME types');
select is((select count(*)::integer from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'employee_documents_%'),3,'storage object access is governed by separate insert, select, and update policies');
select ok(not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and ('anon'=any(roles) or 'public'=any(roles)) and policyname like 'employee_documents_%'),'anonymous users have no employee-document Storage policy');

insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('86000000-0000-0000-0000-000000000001','authenticated','authenticated','storage-admin@example.test',now(),'{}','{}',now(),now()),
('86000000-0000-0000-0000-000000000002','authenticated','authenticated','storage-a@example.test',now(),'{}','{}',now(),now()),
('86000000-0000-0000-0000-000000000003','authenticated','authenticated','storage-b@example.test',now(),'{}','{}',now(),now());
insert into public.profiles(id,role,display_name) values
('86000000-0000-0000-0000-000000000001','admin','Storage Admin'),
('86000000-0000-0000-0000-000000000002','employee','Storage Employee A'),
('86000000-0000-0000-0000-000000000003','employee','Storage Employee B');
insert into public.employee_profiles(id,profile_id,employee_number,first_name,last_name) values
('86000000-0000-0000-0000-000000000012','86000000-0000-0000-0000-000000000002','STORAGE-A','Storage','A'),
('86000000-0000-0000-0000-000000000013','86000000-0000-0000-0000-000000000003','STORAGE-B','Storage','B');
insert into public.document_categories(id,code,name,employee_visible_default) values('86000000-0000-0000-0000-000000000020','STORAGE-TEST','Storage Test',true);
insert into public.documents(id,employee_id,document_category_id,storage_object_path,original_filename,mime_type,size_bytes,is_employee_visible,status) values
('86000000-0000-0000-0000-000000000031','86000000-0000-0000-0000-000000000012','86000000-0000-0000-0000-000000000020','objects/86000000-0000-0000-0000-000000000041/86000000-0000-0000-0000-000000000051.pdf','employee-a.pdf','application/pdf',5,true,'available'),
('86000000-0000-0000-0000-000000000032','86000000-0000-0000-0000-000000000013','86000000-0000-0000-0000-000000000020','objects/86000000-0000-0000-0000-000000000042/86000000-0000-0000-0000-000000000052.pdf','employee-b.pdf','application/pdf',5,true,'available');
insert into storage.objects(bucket_id,name,owner_id) values
('employee-documents','objects/86000000-0000-0000-0000-000000000041/86000000-0000-0000-0000-000000000051.pdf','86000000-0000-0000-0000-000000000002'),
('employee-documents','objects/86000000-0000-0000-0000-000000000042/86000000-0000-0000-0000-000000000052.pdf','86000000-0000-0000-0000-000000000003');

set local role authenticated;
select set_config('request.jwt.claim.sub','86000000-0000-0000-0000-000000000002',true);
select is((select count(*)::integer from storage.objects where bucket_id='employee-documents'),1,'employee A can select only their linked authorized object');
select set_config('request.jwt.claim.sub','86000000-0000-0000-0000-000000000001',true);
select is((select count(*)::integer from storage.objects where bucket_id='employee-documents'),2,'administrator can select all employee objects');
reset role;
select * from finish();
rollback;
