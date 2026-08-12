-- Keep the report endpoint behind normal RLS as well as its explicit admin check.
alter function public.get_admin_dashboard_summary(date,date) security invoker;
