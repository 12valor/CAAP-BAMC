begin;
create extension if not exists pgtap with schema extensions;
set local search_path=extensions,public,pg_catalog;
select plan(10);

select has_function('public','get_my_statement',array['date','date','uuid','uuid'],'identity-derived statement function exists');
select ok(not has_function_privilege('anon','public.get_my_statement(date,date,uuid,uuid)','execute'),'anonymous users cannot execute statements');
select ok(has_function_privilege('authenticated','public.get_my_statement(date,date,uuid,uuid)','execute'),'authenticated employees may execute statements');
select ok(not exists(select 1 from information_schema.parameters where specific_schema='public' and specific_name like 'get_my_statement_%' and parameter_name ilike '%employee%'),'statement accepts no employee identifier');
select function_lang_is('public','get_my_statement',array['date','date','uuid','uuid'],'sql','statement remains SQL based');
select volatility_is('public','get_my_statement',array['date','date','uuid','uuid'],'stable','statement is stable');
select ok((select not prosecdef from pg_proc where oid='public.get_my_statement(date,date,uuid,uuid)'::regprocedure),'statement uses invoker rights and underlying RLS');
select ok(pg_get_functiondef('public.get_my_statement(date,date,uuid,uuid)'::regprocedure) like '%t.status = ''posted''%' and pg_get_functiondef('public.get_my_statement(date,date,uuid,uuid)'::regprocedure) like '%t.deleted_at is null%','statement excludes inactive and soft-deleted transactions');
select ok(pg_get_functiondef('public.get_my_statement(date,date,uuid,uuid)'::regprocedure) like '%over (order by t.transaction_date, t.id rows unbounded preceding)%','running balance uses stable full-ledger ordering');
select ok(pg_get_functiondef('public.get_my_statement(date,date,uuid,uuid)'::regprocedure) not ilike '%leave_%','employee statement contains no leave data');

select * from finish();
rollback;
