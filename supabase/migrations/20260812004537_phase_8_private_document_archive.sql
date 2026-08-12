-- Phase 8: private employee document archive.

alter table public.documents
  add column if not exists upload_attempts integer not null default 0 check (upload_attempts >= 0),
  add column if not exists upload_error text,
  add column if not exists uploaded_at timestamptz;

alter table public.documents drop constraint if exists documents_mime_type_allowed;
alter table public.documents add constraint documents_mime_type_allowed
  check (mime_type in ('application/pdf', 'image/jpeg', 'image/png'));

create index if not exists documents_category_cursor_idx
  on public.documents (document_category_id, created_at desc, id desc)
  where deleted_at is null;
create index if not exists documents_search_idx
  on public.documents using gin (to_tsvector('simple', original_filename || ' ' || metadata::text));

insert into public.system_settings (
  setting_key, setting_value, description
) values (
  'documents.max_file_size_bytes',
  '{"value":26214400,"maximum":52428800,"resumable_threshold":6291456}'::jsonb,
  'Document upload limits in bytes. The hard bucket limit remains 50 MB.'
) on conflict (setting_key) do nothing;

insert into public.document_categories (code, name, description, employee_visible_default, sort_order)
values
  ('PERSONNEL', 'Personnel Records', 'Employee personnel documents.', true, 10),
  ('FINANCIAL', 'Financial Records', 'Authorized financial supporting documents.', true, 20),
  ('LEAVE', 'Leave Records', 'Leave applications and supporting documents.', true, 30),
  ('OTHER', 'Other Documents', 'Other authorized employee documents.', false, 90)
on conflict do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'employee-documents', 'employee-documents', false, 52428800,
  array['application/pdf', 'image/jpeg', 'image/png']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists employee_documents_admin_insert on storage.objects;
create policy employee_documents_admin_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'employee-documents'
  and (select private.is_admin())
  and exists (
    select 1 from public.documents d
    where d.storage_object_path = name
      and d.status = 'pending'
      and d.deleted_at is null
      and d.created_by = (select auth.uid())
  )
);

drop policy if exists employee_documents_authorized_select on storage.objects;
create policy employee_documents_authorized_select
on storage.objects for select to authenticated
using (
  bucket_id = 'employee-documents'
  and exists (
    select 1 from public.documents d
    where d.storage_object_path = name
      and d.status = 'available'
      and d.deleted_at is null
      and (
        (select private.is_admin())
        or (
          d.employee_id = (select private.current_employee_id())
          and d.is_employee_visible
        )
      )
  )
);

drop policy if exists employee_documents_admin_update on storage.objects;
create policy employee_documents_admin_update
on storage.objects for update to authenticated
using (bucket_id = 'employee-documents' and (select private.is_admin()))
with check (bucket_id = 'employee-documents' and (select private.is_admin()));

-- Storage objects are retained when document metadata is archived. Only the
-- service role may remove abandoned pending uploads during recovery cleanup.
revoke all on table storage.objects from anon;

create or replace function public.manage_document(
  operation text,
  target_id uuid default null,
  payload jsonb default '{}'::jsonb,
  change_reason text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  result_id uuid := target_id;
  category_visible boolean;
begin
  if actor_id is null or not private.is_admin() then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;

  if operation = 'prepare' then
    if (payload->>'storage_object_path') !~ '^objects/[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|jpg|jpeg|png)$' then
      raise exception 'The storage path is invalid.' using errcode = '22023';
    end if;
    select employee_visible_default into category_visible
    from public.document_categories
    where id = (payload->>'document_category_id')::uuid and deleted_at is null and is_active;
    if not found then raise exception 'Document category was not found.' using errcode = 'P0002'; end if;
    perform set_config('app.audit_reason', 'Document upload prepared', true);
    insert into public.documents (
      employee_id, document_category_id, storage_object_path, original_filename,
      mime_type, size_bytes, document_date, is_employee_visible, status, metadata,
      upload_attempts, created_by, updated_by
    ) values (
      (payload->>'employee_id')::uuid, (payload->>'document_category_id')::uuid,
      payload->>'storage_object_path', btrim(payload->>'original_filename'),
      payload->>'mime_type', (payload->>'size_bytes')::bigint,
      nullif(payload->>'document_date', '')::date,
      coalesce((payload->>'is_employee_visible')::boolean, category_visible),
      'pending', coalesce(payload->'metadata', '{}'::jsonb), 1, actor_id, actor_id
    ) returning id into result_id;
  elsif operation = 'finalize' then
    perform set_config('app.audit_reason', 'Document upload completed', true);
    update public.documents set status = 'available', uploaded_at = clock_timestamp(),
      upload_error = null, updated_by = actor_id
    where id = target_id and status = 'pending' and deleted_at is null;
    if not found then raise exception 'Pending document was not found.' using errcode = 'P0002'; end if;
  elsif operation = 'retry' then
    perform set_config('app.audit_reason', 'Document upload retried', true);
    update public.documents set upload_attempts = upload_attempts + 1,
      upload_error = null, updated_by = actor_id
    where id = target_id and status = 'pending' and deleted_at is null;
    if not found then raise exception 'Pending document was not found.' using errcode = 'P0002'; end if;
  elsif operation = 'fail' then
    perform set_config('app.audit_reason', 'Document upload failed', true);
    update public.documents set upload_error = left(payload->>'message', 500), updated_by = actor_id
    where id = target_id and status = 'pending' and deleted_at is null;
  elsif operation = 'update' then
    if change_reason is null or length(btrim(change_reason)) < 5 then
      raise exception 'A reason is required.' using errcode = '22023';
    end if;
    perform set_config('app.audit_reason', btrim(change_reason), true);
    update public.documents set
      original_filename = coalesce(nullif(btrim(payload->>'original_filename'), ''), original_filename),
      document_category_id = coalesce(nullif(payload->>'document_category_id', '')::uuid, document_category_id),
      document_date = case when payload ? 'document_date' then nullif(payload->>'document_date', '')::date else document_date end,
      is_employee_visible = coalesce((payload->>'is_employee_visible')::boolean, is_employee_visible),
      metadata = coalesce(payload->'metadata', metadata), updated_by = actor_id
    where id = target_id and deleted_at is null;
    if not found then raise exception 'Document was not found.' using errcode = 'P0002'; end if;
  elsif operation = 'soft_delete' then
    if change_reason is null or length(btrim(change_reason)) < 5 then raise exception 'A deletion reason is required.' using errcode = '22023'; end if;
    perform set_config('app.audit_reason', btrim(change_reason), true);
    update public.documents set deleted_at = clock_timestamp(), deleted_by = actor_id,
      deletion_reason = btrim(change_reason), updated_by = actor_id
    where id = target_id and deleted_at is null;
    if not found then raise exception 'Document was not found.' using errcode = 'P0002'; end if;
  elsif operation = 'restore' then
    if change_reason is null or length(btrim(change_reason)) < 5 then raise exception 'A restore reason is required.' using errcode = '22023'; end if;
    perform set_config('app.audit_reason', btrim(change_reason), true);
    update public.documents set deleted_at = null, deleted_by = null, deletion_reason = null,
      updated_by = actor_id
    where id = target_id and deleted_at is not null;
    if not found then raise exception 'Archived document was not found.' using errcode = 'P0002'; end if;
  else
    raise exception 'Unsupported document operation.' using errcode = '22023';
  end if;
  return result_id;
end
$$;

revoke all on function public.manage_document(text, uuid, jsonb, text) from public, anon;
grant execute on function public.manage_document(text, uuid, jsonb, text) to authenticated, service_role;
