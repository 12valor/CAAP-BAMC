create index if not exists account_usernames_created_by_idx
  on public.account_usernames (created_by);

create index if not exists account_usernames_updated_by_idx
  on public.account_usernames (updated_by);

create index if not exists account_usernames_deleted_by_idx
  on public.account_usernames (deleted_by);
