-- Phase 11: admin reporting aggregates and indexed audit subjects.

alter table public.audit_logs
  add column subject_employee_id uuid references public.employee_profiles(id) on delete set null;

create index audit_logs_actor_cursor_idx
  on public.audit_logs(actor_profile_id, occurred_at desc, id desc);
create index audit_logs_subject_cursor_idx
  on public.audit_logs(subject_employee_id, occurred_at desc, id desc)
  where subject_employee_id is not null;
create index audit_logs_action_cursor_idx
  on public.audit_logs(action, occurred_at desc, id desc);
create index audit_logs_module_cursor_idx
  on public.audit_logs(entity_table, occurred_at desc, id desc);
create index login_activity_outcome_cursor_idx
  on public.login_activity(outcome, occurred_at desc, id desc);

create function private.set_audit_subject_employee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate text;
  related_loan uuid;
begin
  candidate := coalesce(new.new_data->>'employee_id', new.old_data->>'employee_id');
  if candidate is not null and candidate ~* '^[0-9a-f-]{36}$' then
    new.subject_employee_id := candidate::uuid;
  elsif new.entity_table = 'employee_profiles' and new.entity_id ~* '^[0-9a-f-]{36}$' then
    new.subject_employee_id := new.entity_id::uuid;
  elsif new.entity_table = 'loans' and new.entity_id ~* '^[0-9a-f-]{36}$' then
    select employee_id into new.subject_employee_id from public.loans where id = new.entity_id::uuid;
  elsif new.entity_table = 'loan_schedules' then
    candidate := coalesce(new.new_data->>'loan_id', new.old_data->>'loan_id');
    if candidate is not null and candidate ~* '^[0-9a-f-]{36}$' then
      related_loan := candidate::uuid;
      select employee_id into new.subject_employee_id from public.loans where id = related_loan;
    end if;
  end if;
  return new;
end
$$;

revoke execute on function private.set_audit_subject_employee() from public, anon, authenticated, service_role;

create trigger audit_logs_subject_employee
before insert on public.audit_logs
for each row execute function private.set_audit_subject_employee();

alter table public.audit_logs disable trigger audit_logs_immutable;
update public.audit_logs a
set subject_employee_id = coalesce(
  case when coalesce(a.new_data->>'employee_id', a.old_data->>'employee_id') ~* '^[0-9a-f-]{36}$'
    then coalesce(a.new_data->>'employee_id', a.old_data->>'employee_id')::uuid end,
  case when a.entity_table = 'employee_profiles' and a.entity_id ~* '^[0-9a-f-]{36}$'
    then a.entity_id::uuid end
)
where subject_employee_id is null;
alter table public.audit_logs enable trigger audit_logs_immutable;

create function public.get_admin_dashboard_summary(start_date date default null, end_date date default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if not (select private.is_admin()) then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;
  if start_date is not null and end_date is not null and start_date > end_date then
    raise exception 'Start date must not be after end date.' using errcode = '22007';
  end if;

  with employee_totals as (
    select count(*) total_count,
      count(*) filter(where employment_status = 'active' and deleted_at is null) active_count
    from public.employee_profiles
  ), payment_totals as (
    select loan_id, coalesce(sum(amount), 0) paid
    from public.loan_payments where status = 'posted' and deleted_at is null group by loan_id
  ), loan_totals as (
    select count(*) active_count, coalesce(sum(l.principal_amount),0) original_principal,
      coalesce(sum(greatest(coalesce(l.total_payable_amount,l.principal_amount)-coalesce(p.paid,0),0)),0) scheduled_outstanding
    from public.loans l left join payment_totals p on p.loan_id=l.id
    where l.status='active' and l.deleted_at is null
  ), tx_totals as (
    select coalesce(sum(amount) filter(where direction='debit'),0) debit,
      coalesce(sum(amount) filter(where direction='credit'),0) credit
    from public.transactions
    where status='posted' and deleted_at is null
      and (start_date is null or transaction_date>=start_date)
      and (end_date is null or transaction_date<=end_date)
  ), rebate_totals as (
    select coalesce(sum(amount),0) total from public.rebates
    where status='posted' and deleted_at is null
      and (start_date is null or rebate_date>=start_date)
      and (end_date is null or rebate_date<=end_date)
  ), document_totals as (
    select count(*) filter(where deleted_at is null) total,
      count(*) filter(where status='available' and deleted_at is null) available,
      count(*) filter(where status='pending' and deleted_at is null) pending,
      count(*) filter(where status='archived' or deleted_at is not null) archived,
      coalesce(sum(size_bytes) filter(where deleted_at is null),0) bytes
    from public.documents
  ), leave_summary as (
    select coalesce(jsonb_agg(jsonb_build_object('type',lt.name,'unit',lt.unit,'balance',x.balance::text) order by lt.name),'[]'::jsonb) value
    from (select leave_type_id,sum(balance) balance from public.leave_balances where deleted_at is null group by leave_type_id) x
    join public.leave_types lt on lt.id=x.leave_type_id
  ), recent_transactions as (
    select coalesce(jsonb_agg(to_jsonb(x) order by x.transaction_date desc,x.id desc),'[]'::jsonb) value from (
      select t.id,t.transaction_date,t.reference_number,t.direction,t.amount::text,
        ep.employee_number,concat_ws(' ',ep.first_name,ep.last_name) employee_name,tt.name transaction_type
      from public.transactions t join public.employee_profiles ep on ep.id=t.employee_id
      join public.transaction_types tt on tt.id=t.transaction_type_id
      where t.deleted_at is null order by t.transaction_date desc,t.id desc limit 8
    ) x
  ), recent_imports as (
    select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id desc),'[]'::jsonb) value from (
      select id,source_filename,import_type,status,total_rows,valid_rows,error_rows,created_at
      from public.import_jobs where deleted_at is null order by created_at desc,id desc limit 6
    ) x
  )
  select jsonb_build_object(
    'period',jsonb_build_object('start',start_date,'end',end_date),
    'employees',jsonb_build_object('total',e.total_count,'active',e.active_count),
    'loans',jsonb_build_object('active',l.active_count,'original_principal',l.original_principal::text,'scheduled_outstanding',l.scheduled_outstanding::text),
    'transactions',jsonb_build_object('debit',t.debit::text,'credit',t.credit::text),
    'rebates',jsonb_build_object('total',r.total::text),
    'documents',jsonb_build_object('total',d.total,'available',d.available,'pending',d.pending,'archived',d.archived,'bytes',d.bytes),
    'leave',ls.value,'recent_transactions',rt.value,'recent_imports',ri.value,'generated_at',clock_timestamp()
  ) into result from employee_totals e,loan_totals l,tx_totals t,rebate_totals r,document_totals d,leave_summary ls,recent_transactions rt,recent_imports ri;
  return result;
end
$$;

revoke all on function public.get_admin_dashboard_summary(date,date) from public, anon, authenticated, service_role;
grant execute on function public.get_admin_dashboard_summary(date,date) to authenticated, service_role;

comment on function public.get_admin_dashboard_summary(date,date) is
  'Admin-only Phase 11 dashboard aggregates. Scheduled outstanding is provisional total payable less posted payments.';
