begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select no_plan();

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'phase2-admin@example.invalid', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'phase2-employee-a@example.invalid', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('30000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'phase2-employee-b@example.invalid', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.profiles (id, role, display_name)
values
  ('10000000-0000-0000-0000-000000000001', 'admin', 'Phase 2 Admin'),
  ('20000000-0000-0000-0000-000000000001', 'employee', 'Phase 2 Employee A'),
  ('30000000-0000-0000-0000-000000000001', 'employee', 'Phase 2 Employee B');

insert into public.employee_profiles (id, profile_id, employee_number, first_name, last_name)
values
  ('20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'PHASE2-A', 'Employee', 'A'),
  ('30000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'PHASE2-B', 'Employee', 'B');

insert into public.financial_categories (id, code, name)
values ('40000000-0000-0000-0000-000000000001', 'TEST-CAT', 'Test Category');
insert into public.transaction_types (id, financial_category_id, code, name, direction)
values ('40000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'TEST-TXN', 'Test Transaction', 'debit');
insert into public.transactions (id, employee_id, transaction_type_id, transaction_date, direction, amount, status)
values
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', current_date, 'debit', 10.25, 'posted'),
  ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', current_date, 'debit', 20.50, 'posted');

insert into public.document_categories (id, code, name, employee_visible_default)
values ('60000000-0000-0000-0000-000000000001', 'TEST-DOC', 'Test Documents', true);
insert into public.documents (id, employee_id, document_category_id, storage_object_path, original_filename, mime_type, size_bytes, is_employee_visible, status)
values
  ('60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', 'phase2/a/visible.pdf', 'visible.pdf', 'application/pdf', 1, true, 'available'),
  ('60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', 'phase2/a/private.pdf', 'private.pdf', 'application/pdf', 1, false, 'available'),
  ('60000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', 'phase2/b/visible.pdf', 'other.pdf', 'application/pdf', 1, true, 'available');

set local role anon;
select throws_ok(
  $$select * from public.profiles$$,
  '42501',
  null,
  'anonymous cannot read profiles'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select results_eq(
  $$select id from public.transactions order by id$$,
  array['50000000-0000-0000-0000-000000000001'::uuid],
  'employee sees only their own transactions'
);

select results_eq(
  $$select id from public.documents order by id$$,
  array['60000000-0000-0000-0000-000000000002'::uuid],
  'employee sees only authorized own documents'
);

select throws_ok(
  $$insert into public.transactions (employee_id, transaction_type_id, transaction_date, direction, amount) values ('20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', current_date, 'debit', 1)$$,
  '42501',
  null,
  'employee cannot insert financial records'
);

select results_eq(
  $$update public.transactions set description = 'blocked' where id = '50000000-0000-0000-0000-000000000001' returning id$$,
  array[]::uuid[],
  'employee cannot update financial records'
);

select throws_ok(
  $$delete from public.transactions where id = '50000000-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'employee has no permanent-delete privilege'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*)::integer from public.transactions), 2, 'admin can read all employee transactions');
select lives_ok(
  $$update public.transactions set description = 'admin update' where id = '50000000-0000-0000-0000-000000000001'$$,
  'admin can update through an admin RLS policy'
);
select throws_ok(
  $$delete from public.transactions where id = '50000000-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'admin has no permanent-delete privilege'
);
select throws_ok(
  $$update public.audit_logs set reason = 'tamper' where true$$,
  '42501',
  null,
  'admin cannot edit audit logs'
);

reset role;
select * from finish();
rollback;
