do $$
declare
  definition text;
  repaired text;
begin
  select pg_get_functiondef('public.confirm_import_job(uuid)'::regprocedure) into definition;
  repaired := replace(definition, 'nullif(data->>''employment_category'','''')', 'coalesce(nullif(data->>''employment_category'',''''),''Unspecified'')');
  if repaired = definition then
    raise exception 'Could not locate the import employment category expression to repair.';
  end if;
  execute repaired;
end
$$;
