-- Functions that only operate through existing admin or employee RLS do not
-- require definer privileges. Import confirmation remains definer-scoped
-- because it appends an immutable audit action and performs one atomic job.
alter function public.manage_document(text, uuid, jsonb, text) security invoker;
alter function public.get_my_financial_overview() security invoker;
alter function public.get_my_statement(date, date, uuid, uuid) security invoker;
