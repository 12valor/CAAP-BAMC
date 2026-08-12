do $$
declare
  definition text;
  repaired text;
begin
  select pg_get_functiondef('public.confirm_import_job(uuid)'::regprocedure) into definition;
  repaired := replace(definition, 'hire_date, email, phone, employment_category', 'hire_date, email_address, mobile_number, employment_category');
  if repaired = definition then
    raise exception 'Could not locate the import employee column list to repair.';
  end if;
  execute repaired;
end
$$;
