do $$
declare
  definition text;
  repaired text;
  old_branch text := $old$elsif row_record.entity_type = 'loan_payments' then
      select l.id,l.employee_id into loan_id,employee_id from public.loans l join public.loan_types lt on lt.id=l.loan_type_id where l.account_number=data->>'account_number' and lower(lt.code)=lower(data->>'loan_type_code') and l.deleted_at is null;
      insert into public.loan_payments (loan_id, employee_id, payment_date, amount, reference_number, status, notes, created_by, updated_by)
      values (loan_id,employee_id,(data->>'payment_date')::date,(data->>'amount')::numeric,nullif(data->>'reference_number',''),'posted',nullif(data->>'notes',''),actor_id,actor_id)
      returning id into target_id;$old$;
  new_branch text := $new$elsif row_record.entity_type = 'loan_payments' then
      select l.id into loan_id from public.loans l join public.loan_types lt on lt.id=l.loan_type_id where l.account_number=data->>'account_number' and lower(lt.code)=lower(data->>'loan_type_code') and l.deleted_at is null;
      select id into type_id from public.transaction_types where lower(code)=lower(data->>'transaction_type_code') and direction='credit' and deleted_at is null and is_active;
      target_id := public.record_loan_payment(actor_id,loan_id,(data->>'payment_date')::date,(data->>'amount')::numeric,type_id,nullif(data->>'reference_number',''),nullif(data->>'notes',''));$new$;
begin
  select pg_get_functiondef('public.confirm_import_job(uuid)'::regprocedure) into definition;
  repaired := replace(definition, old_branch, new_branch);
  if repaired = definition then raise exception 'Could not locate the loan payment import branch to repair.'; end if;
  execute repaired;
end
$$;
