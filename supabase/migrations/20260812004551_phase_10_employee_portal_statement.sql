-- Phase 10: employee-scoped overview and statement data.

create or replace function public.get_my_financial_overview()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select private.current_employee_id() employee_id),
  totals as (
    select coalesce(sum(amount) filter(where direction='debit'),0) debit,
      coalesce(sum(amount) filter(where direction='credit'),0) credit
    from public.transactions t, me where t.employee_id=me.employee_id and t.status='posted' and t.deleted_at is null
  ), loans as (
    select count(*) active_count,
      coalesce(sum(coalesce(total_payable_amount,principal_amount) - coalesce((select sum(p.amount) from public.loan_payments p where p.loan_id=l.id and p.status='posted' and p.deleted_at is null),0)),0) outstanding
    from public.loans l, me where l.employee_id=me.employee_id and l.status='active' and l.deleted_at is null
  )
  select jsonb_build_object(
    'total_debit', totals.debit::text, 'total_credit', totals.credit::text,
    'current_balance', (totals.debit-totals.credit)::text,
    'active_loan_count', loans.active_count, 'outstanding_amount', loans.outstanding::text
  ) from totals,loans
  where (select employee_id from me) is not null;
$$;

create or replace function public.get_my_statement(start_date date default null,end_date date default null,type_filter uuid default null,category_filter uuid default null)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select private.current_employee_id() employee_id),
  employee as (
    select ep.id,ep.employee_number,concat_ws(' ',ep.first_name,ep.middle_name,ep.last_name,ep.suffix) full_name
    from public.employee_profiles ep,me where ep.id=me.employee_id and ep.deleted_at is null
  ), tx as (
    select t.id,t.transaction_date,t.reference_number,t.direction,t.amount,t.description,
      tt.name transaction_type,fc.name category,
      sum(case when t.direction='debit' then t.amount else -t.amount end)
        over(order by t.transaction_date,t.id rows unbounded preceding) running_balance
    from public.transactions t
    join public.transaction_types tt on tt.id=t.transaction_type_id
    left join public.financial_categories fc on fc.id=tt.financial_category_id,me
    where t.employee_id=me.employee_id and t.status='posted' and t.deleted_at is null
      and (start_date is null or t.transaction_date>=start_date)
      and (end_date is null or t.transaction_date<=end_date)
      and (type_filter is null or t.transaction_type_id=type_filter)
      and (category_filter is null or tt.financial_category_id=category_filter)
  ), loan_data as (
    select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'type',lt.name,'account_number',l.account_number,'principal',l.principal_amount::text,'total_payable',coalesce(l.total_payable_amount,l.principal_amount)::text,'status',l.status,
      'schedules',(select coalesce(jsonb_agg(jsonb_build_object('due_date',s.due_date,'total_due',s.total_due::text,'status',s.status) order by s.due_date),'[]'::jsonb) from public.loan_schedules s where s.loan_id=l.id and s.deleted_at is null)) order by l.start_date desc),'[]'::jsonb) value
    from public.loans l join public.loan_types lt on lt.id=l.loan_type_id,me where l.employee_id=me.employee_id and l.deleted_at is null and l.status in('active','paid','closed')
  ), rebate_data as (
    select coalesce(jsonb_agg(jsonb_build_object('date',r.rebate_date,'type',rt.name,'amount',r.amount::text,'status',r.status) order by r.rebate_date desc),'[]'::jsonb) value
    from public.rebates r join public.rebate_types rt on rt.id=r.rebate_type_id,me where r.employee_id=me.employee_id and r.deleted_at is null and r.status<>'cancelled'
  ), attachment_data as (
    select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'filename',d.original_filename,'date',d.document_date,'mime_type',d.mime_type) order by d.created_at desc),'[]'::jsonb) value
    from public.documents d,me where d.employee_id=me.employee_id and d.deleted_at is null and d.status='available' and d.is_employee_visible
  )
  select jsonb_build_object(
    'employee',to_jsonb(employee),'period',jsonb_build_object('start',start_date,'end',end_date),'generated_at',clock_timestamp(),
    'transactions',coalesce((select jsonb_agg(jsonb_build_object('id',id,'date',transaction_date,'reference_number',reference_number,'direction',direction,'amount',amount::text,'description',description,'transaction_type',transaction_type,'category',category,'running_balance',running_balance::text) order by transaction_date,id) from tx),'[]'::jsonb),
    'totals',jsonb_build_object('debit',coalesce((select sum(amount) from tx where direction='debit'),0)::text,'credit',coalesce((select sum(amount) from tx where direction='credit'),0)::text),
    'loans',(select value from loan_data),'rebates',(select value from rebate_data),'attachments',(select value from attachment_data)
  ) from employee;
$$;

revoke all on function public.get_my_financial_overview() from public, anon;
revoke all on function public.get_my_statement(date,date,uuid,uuid) from public, anon;
grant execute on function public.get_my_financial_overview() to authenticated, service_role;
grant execute on function public.get_my_statement(date,date,uuid,uuid) to authenticated, service_role;
