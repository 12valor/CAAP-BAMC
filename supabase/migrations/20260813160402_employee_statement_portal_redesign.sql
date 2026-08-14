-- Employee portal redesign: one identity-derived, document-style statement.
-- This function remains security invoker so the underlying table RLS policies
-- continue to enforce employee ownership.

create or replace function public.get_my_statement(
  start_date date default null,
  end_date date default null,
  type_filter uuid default null,
  category_filter uuid default null
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (
    select private.current_employee_id() as employee_id
  ),
  employee as (
    select
      ep.id,
      ep.employee_number,
      concat_ws(' ', ep.first_name, ep.middle_name, ep.last_name, ep.suffix) as full_name,
      ep.department,
      ep.position_title
    from public.employee_profiles ep, me
    where ep.id = me.employee_id
      and ep.deleted_at is null
  ),
  ledger_rows as (
    select
      t.id,
      t.transaction_date,
      t.reference_number,
      t.direction,
      t.amount,
      t.description,
      t.transaction_type_id,
      tt.financial_category_id,
      tt.name as transaction_type,
      fc.name as category,
      sum(case when t.direction = 'debit' then t.amount else -t.amount end)
        over (order by t.transaction_date, t.id rows unbounded preceding) as running_balance
    from public.transactions t
    join public.transaction_types tt on tt.id = t.transaction_type_id
    left join public.financial_categories fc on fc.id = tt.financial_category_id,
      me
    where t.employee_id = me.employee_id
      and t.status = 'posted'
      and t.deleted_at is null
  ),
  filtered_transactions as (
    select *
    from ledger_rows
    where (start_date is null or transaction_date >= start_date)
      and (end_date is null or transaction_date <= end_date)
      and (type_filter is null or transaction_type_id = type_filter)
      and (category_filter is null or financial_category_id = category_filter)
  ),
  ledger_totals as (
    select
      coalesce(sum(amount) filter (where direction = 'debit'), 0) as debit,
      coalesce(sum(amount) filter (where direction = 'credit'), 0) as credit
    from ledger_rows
  ),
  selected_totals as (
    select
      coalesce(sum(amount) filter (where direction = 'debit'), 0) as debit,
      coalesce(sum(amount) filter (where direction = 'credit'), 0) as credit
    from filtered_transactions
  ),
  active_loans as (
    select
      l.id,
      lt.name as type,
      l.account_number,
      l.principal_amount,
      coalesce(l.total_payable_amount, l.principal_amount) as total_payable,
      greatest(
        coalesce(l.total_payable_amount, l.principal_amount)
          - coalesce((
              select sum(p.amount)
              from public.loan_payments p
              where p.loan_id = l.id
                and p.status = 'posted'
                and p.deleted_at is null
            ), 0),
        0
      ) as outstanding_balance,
      l.start_date,
      l.term_count,
      l.installment_frequency,
      l.status,
      (
        select min(s.due_date)
        from public.loan_schedules s
        where s.loan_id = l.id
          and s.deleted_at is null
          and s.status in ('pending', 'partially_paid', 'overdue')
      ) as next_payment_date,
      (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'installment_number', s.installment_number,
              'due_date', s.due_date,
              'scheduled_amount', s.total_due::text,
              'amount_paid', s.paid_amount::text,
              'remaining_amount', greatest(s.total_due - s.paid_amount, 0)::text,
              'status', s.status
            ) order by s.due_date, s.installment_number, s.id
          ),
          '[]'::jsonb
        )
        from public.loan_schedules s
        where s.loan_id = l.id
          and s.deleted_at is null
          and s.status <> 'cancelled'
      ) as schedules
    from public.loans l
    join public.loan_types lt on lt.id = l.loan_type_id,
      me
    where l.employee_id = me.employee_id
      and l.deleted_at is null
      and l.status = 'active'
  ),
  loan_data as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'type', type,
          'account_number', account_number,
          'principal', principal_amount::text,
          'total_payable', total_payable::text,
          'outstanding_balance', outstanding_balance::text,
          'start_date', start_date,
          'term_count', term_count,
          'installment_frequency', installment_frequency,
          'status', status,
          'next_payment_date', next_payment_date,
          'schedules', schedules
        ) order by start_date desc, id desc
      ),
      '[]'::jsonb
    ) as value,
    coalesce(sum(outstanding_balance), 0) as outstanding_total
    from active_loans
  ),
  rebate_data as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'date', r.rebate_date,
          'type', rt.name,
          'reference_number', t.reference_number,
          'amount', r.amount::text,
          'description', r.reason,
          'status', r.status
        ) order by r.rebate_date desc, r.id desc
      ),
      '[]'::jsonb
    ) as value
    from public.rebates r
    join public.rebate_types rt on rt.id = r.rebate_type_id
    left join public.transactions t on t.id = r.transaction_id,
      me
    where r.employee_id = me.employee_id
      and r.deleted_at is null
      and r.status <> 'cancelled'
  ),
  attachment_data as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'filename', d.original_filename,
          'category', dc.name,
          'related_record', case
            when related.rebate_id is not null then concat('Rebate', coalesce(' · ' || related.reference_number, ''))
            when related.transaction_id is not null then concat('Transaction', coalesce(' · ' || related.reference_number, ''))
            else 'Employee record'
          end,
          'date', coalesce(d.document_date, d.created_at::date),
          'mime_type', d.mime_type
        ) order by coalesce(d.document_date, d.created_at::date) desc, d.id desc
      ),
      '[]'::jsonb
    ) as value
    from public.documents d
    join public.document_categories dc on dc.id = d.document_category_id
    left join lateral (
      select t.id as transaction_id, t.reference_number, r.id as rebate_id
      from public.transactions t
      left join public.rebates r
        on r.transaction_id = t.id
        and r.deleted_at is null
        and r.status <> 'cancelled'
      where t.attachment_document_id = d.id
        and t.deleted_at is null
        and t.status = 'posted'
      order by t.transaction_date desc, t.id desc
      limit 1
    ) related on true,
      me
    where d.employee_id = me.employee_id
      and d.deleted_at is null
      and d.status = 'available'
      and d.is_employee_visible
  )
  select jsonb_build_object(
    'employee', to_jsonb(employee),
    'period', jsonb_build_object('start', start_date, 'end', end_date),
    'generated_at', clock_timestamp(),
    'summary', jsonb_build_object(
      'current_balance', (ledger_totals.debit - ledger_totals.credit)::text,
      'selected_debit', selected_totals.debit::text,
      'selected_credit', selected_totals.credit::text,
      'outstanding_loan_balance', loan_data.outstanding_total::text
    ),
    'transactions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', id,
          'date', transaction_date,
          'reference_number', reference_number,
          'direction', direction,
          'amount', amount::text,
          'description', description,
          'transaction_type', transaction_type,
          'category', category,
          'running_balance', running_balance::text
        ) order by transaction_date, id
      )
      from filtered_transactions
    ), '[]'::jsonb),
    'totals', jsonb_build_object(
      'debit', selected_totals.debit::text,
      'credit', selected_totals.credit::text
    ),
    'loans', loan_data.value,
    'rebates', rebate_data.value,
    'attachments', attachment_data.value
  )
  from employee, ledger_totals, selected_totals, loan_data, rebate_data, attachment_data;
$$;

revoke all on function public.get_my_statement(date, date, uuid, uuid) from public, anon;
grant execute on function public.get_my_statement(date, date, uuid, uuid) to authenticated, service_role;
