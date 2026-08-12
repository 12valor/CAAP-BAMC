revoke execute on function public.confirm_import_job(uuid) from authenticated;
grant execute on function public.confirm_import_job(uuid) to service_role;

create function public.confirm_import_job_as_admin(target_job_id uuid, actor_profile_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if actor_profile_id is null or not exists (
    select 1 from public.profiles p
    where p.id=actor_profile_id and p.role='admin' and p.status='active' and p.deleted_at is null
  ) then
    raise exception 'An active administrator is required.' using errcode='42501';
  end if;
  perform set_config('request.jwt.claim.sub', actor_profile_id::text, true);
  return public.confirm_import_job(target_job_id);
end
$$;

revoke all on function public.confirm_import_job_as_admin(uuid,uuid) from public,anon,authenticated;
grant execute on function public.confirm_import_job_as_admin(uuid,uuid) to service_role;
