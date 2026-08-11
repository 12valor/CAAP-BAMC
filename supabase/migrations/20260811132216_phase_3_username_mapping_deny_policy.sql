create policy account_usernames_browser_deny
on public.account_usernames
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
