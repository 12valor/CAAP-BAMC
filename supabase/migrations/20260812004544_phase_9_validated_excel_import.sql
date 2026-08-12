-- Phase 9: staged, validated workbook imports.

alter table public.import_jobs drop constraint if exists import_jobs_import_type_check;
alter table public.import_jobs add constraint import_jobs_import_type_check check (
  import_type in (
    'workbook','employees','opening_balances','transactions','loans','loan_schedules',
    'loan_payments','rebates','leave_balances','leave_history','document_metadata'
  )
);
alter table public.import_jobs
  add column if not exists source_digest text,
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by uuid references public.profiles(id) on delete set null;
create unique index if not exists import_jobs_completed_digest_uidx
  on public.import_jobs (source_digest)
  where source_digest is not null and status in ('processing','completed','completed_with_errors') and deleted_at is null;
create index if not exists import_jobs_confirmed_by_idx on public.import_jobs (confirmed_by);

alter table public.import_rows
  add column if not exists entity_type text,
  add column if not exists warning_message text;
alter table public.import_rows add constraint import_rows_entity_type_check check (
  entity_type is null or entity_type in (
    'employees','opening_balances','transactions','loans','loan_schedules',
    'loan_payments','rebates','leave_balances','leave_history','document_metadata'
  )
);

create index if not exists import_rows_entity_status_idx
  on public.import_rows (import_job_id, entity_type, status, row_number)
  where deleted_at is null;

create or replace function public.confirm_import_job(target_job_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  job public.import_jobs%rowtype;
  imported_count integer := 0;
  row_record public.import_rows%rowtype;
  data jsonb;
  employee_id uuid;
  type_id uuid;
  loan_id uuid;
  payment_id uuid;
  category_id uuid;
  target_id uuid;
begin
  if actor_id is null or not private.is_admin() then raise exception 'Administrator access is required.' using errcode = '42501'; end if;
  select * into job from public.import_jobs where id = target_job_id and deleted_at is null for update;
  if not found then raise exception 'Import job was not found.' using errcode = 'P0002'; end if;
  if job.status <> 'ready' or job.error_rows <> 0 then raise exception 'Only a ready, error-free import can be confirmed.' using errcode = '22023'; end if;
  if exists (select 1 from public.import_jobs j where j.source_digest = job.source_digest and j.id <> job.id and j.status in ('processing','completed','completed_with_errors') and j.deleted_at is null) then
    raise exception 'This workbook was already imported.' using errcode = '23505';
  end if;

  perform set_config('app.audit_reason', 'Validated Excel import confirmed', true);
  update public.import_jobs set status = 'processing', started_at = clock_timestamp(),
    confirmed_at = clock_timestamp(), confirmed_by = actor_id, updated_by = actor_id
  where id = job.id;

  for row_record in
    select * from public.import_rows
    where import_job_id = job.id and status = 'valid' and deleted_at is null
    order by case entity_type
      when 'employees' then 1 when 'opening_balances' then 2 when 'transactions' then 3
      when 'loans' then 4 when 'loan_schedules' then 5 when 'loan_payments' then 6
      when 'rebates' then 7 when 'leave_balances' then 8 when 'leave_history' then 9 else 10 end,
      row_number
  loop
    data := row_record.normalized_data;
    target_id := null;
    if row_record.entity_type = 'employees' then
      insert into public.employee_profiles (
        employee_number, first_name, middle_name, last_name, suffix, department,
        position_title, employment_status, hire_date, email, phone, employment_category,
        notes, created_by, updated_by
      ) values (
        data->>'employee_number', data->>'first_name', nullif(data->>'middle_name',''), data->>'last_name',
        nullif(data->>'suffix',''), nullif(data->>'department',''), nullif(data->>'position_title',''),
        coalesce(nullif(data->>'employment_status',''),'active'), nullif(data->>'hire_date','')::date,
        nullif(data->>'email',''), nullif(data->>'phone',''), nullif(data->>'employment_category',''),
        nullif(data->>'notes',''), actor_id, actor_id
      ) returning id into target_id;
    elsif row_record.entity_type in ('opening_balances','transactions') then
      select id into employee_id from public.employee_profiles where employee_number = data->>'employee_number' and deleted_at is null;
      select id into type_id from public.transaction_types where lower(code) = lower(data->>'type_code') and deleted_at is null and is_active;
      insert into public.transactions (employee_id, transaction_type_id, transaction_date, reference_number, direction, amount, status, description, created_by, updated_by)
      values (employee_id, type_id, (data->>'date')::date, nullif(data->>'reference_number',''), data->>'direction', (data->>'amount')::numeric, 'posted', nullif(data->>'description',''), actor_id, actor_id)
      returning id into target_id;
    elsif row_record.entity_type = 'loans' then
      select id into employee_id from public.employee_profiles where employee_number = data->>'employee_number' and deleted_at is null;
      select id into type_id from public.loan_types where lower(code)=lower(data->>'loan_type_code') and deleted_at is null and is_active;
      insert into public.loans (employee_id, loan_type_id, account_number, start_date, maturity_date, principal_amount, interest_rate, total_payable_amount, term_count, schedule_method, status, rule_snapshot, notes, created_by, updated_by)
      values (employee_id, type_id, data->>'account_number', (data->>'start_date')::date, nullif(data->>'maturity_date','')::date, (data->>'principal')::numeric, nullif(data->>'interest_rate','')::numeric, nullif(data->>'total_payable','')::numeric, nullif(data->>'term_count','')::integer, coalesce(nullif(data->>'schedule_method',''),'manual'), coalesce(nullif(data->>'status',''),'active'), coalesce(data->'rule_snapshot','{}'::jsonb), nullif(data->>'notes',''), actor_id, actor_id)
      returning id into target_id;
    elsif row_record.entity_type = 'loan_schedules' then
      select l.id into loan_id from public.loans l join public.loan_types lt on lt.id=l.loan_type_id where l.account_number=data->>'account_number' and lower(lt.code)=lower(data->>'loan_type_code') and l.deleted_at is null;
      insert into public.loan_schedules (loan_id, installment_number, due_date, principal_due, interest_due, penalty_due, other_due, total_due, generation_method, status, created_by, updated_by)
      values (loan_id, (data->>'installment_number')::integer, (data->>'due_date')::date, coalesce((data->>'principal_due')::numeric,0), coalesce((data->>'interest_due')::numeric,0), coalesce((data->>'penalty_due')::numeric,0), coalesce((data->>'other_due')::numeric,0), (data->>'total_due')::numeric, coalesce(nullif(data->>'generation_method',''),'manual'), coalesce(nullif(data->>'status',''),'pending'), actor_id, actor_id)
      returning id into target_id;
    elsif row_record.entity_type = 'loan_payments' then
      select l.id,l.employee_id into loan_id,employee_id from public.loans l join public.loan_types lt on lt.id=l.loan_type_id where l.account_number=data->>'account_number' and lower(lt.code)=lower(data->>'loan_type_code') and l.deleted_at is null;
      insert into public.loan_payments (loan_id, employee_id, payment_date, amount, reference_number, status, notes, created_by, updated_by)
      values (loan_id,employee_id,(data->>'payment_date')::date,(data->>'amount')::numeric,nullif(data->>'reference_number',''),'posted',nullif(data->>'notes',''),actor_id,actor_id)
      returning id into target_id;
    elsif row_record.entity_type = 'rebates' then
      select id into employee_id from public.employee_profiles where employee_number=data->>'employee_number' and deleted_at is null;
      select id into type_id from public.rebate_types where lower(code)=lower(data->>'rebate_type_code') and deleted_at is null and is_active;
      insert into public.rebates (employee_id,rebate_type_id,rebate_date,amount,status,reason,created_by,updated_by)
      values (employee_id,type_id,(data->>'rebate_date')::date,(data->>'amount')::numeric,coalesce(nullif(data->>'status',''),'approved'),nullif(data->>'reason',''),actor_id,actor_id)
      returning id into target_id;
    elsif row_record.entity_type in ('leave_balances','leave_history') then
      select id into employee_id from public.employee_profiles where employee_number=data->>'employee_number' and deleted_at is null;
      select id into type_id from public.leave_types where lower(code)=lower(data->>'leave_type_code') and deleted_at is null and is_active;
      insert into public.leave_entries (employee_id,leave_type_id,effective_date,entry_kind,quantity_delta,status,reference_number,notes,created_by,updated_by)
      values (employee_id,type_id,(data->>'date')::date,coalesce(nullif(data->>'entry_kind',''),'adjustment'),(data->>'quantity_delta')::numeric,'posted',nullif(data->>'reference_number',''),nullif(data->>'notes',''),actor_id,actor_id)
      returning id into target_id;
    elsif row_record.entity_type = 'document_metadata' then
      select id into employee_id from public.employee_profiles where employee_number=data->>'employee_number' and deleted_at is null;
      select id into category_id from public.document_categories where lower(code)=lower(data->>'category_code') and deleted_at is null and is_active;
      insert into public.documents (employee_id,document_category_id,storage_object_path,original_filename,mime_type,size_bytes,document_date,is_employee_visible,status,metadata,created_by,updated_by)
      values (employee_id,category_id,data->>'storage_object_path',data->>'filename',data->>'mime_type',(data->>'size_bytes')::bigint,nullif(data->>'document_date','')::date,coalesce((data->>'employee_visible')::boolean,false),'pending',coalesce(data->'metadata','{}'::jsonb),actor_id,actor_id)
      returning id into target_id;
    end if;

    update public.import_rows set status='imported', target_record_id=target_id, processed_at=clock_timestamp(), updated_by=actor_id where id=row_record.id;
    imported_count := imported_count + 1;
  end loop;

  insert into public.audit_logs(actor_profile_id,action,entity_table,entity_id,new_data,reason)
  values(actor_id,'import','import_jobs',job.id::text,jsonb_build_object('rows',imported_count,'source_digest',job.source_digest),'Validated Excel import');
  update public.import_jobs set status='completed',completed_at=clock_timestamp(),summary=summary || jsonb_build_object('imported_rows',imported_count),updated_by=actor_id where id=job.id;
  return imported_count;
end
$$;

revoke all on function public.confirm_import_job(uuid) from public, anon;
grant execute on function public.confirm_import_job(uuid) to authenticated, service_role;
