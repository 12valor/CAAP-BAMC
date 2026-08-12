-- Phase 5-6 tables are created after the baseline privilege reset. Remove all
-- implicit PUBLIC/anonymous capabilities before restoring the narrow API set.
revoke all on table public.interest_methods, public.penalty_rules, public.loan_adjustments
from public, anon, authenticated, service_role;

grant select, insert, update on table
  public.interest_methods, public.penalty_rules, public.loan_adjustments
to authenticated, service_role;

create index interest_methods_created_by_fkey_idx on public.interest_methods (created_by);
create index interest_methods_updated_by_fkey_idx on public.interest_methods (updated_by);
create index interest_methods_deleted_by_fkey_idx on public.interest_methods (deleted_by);
create index penalty_rules_created_by_fkey_idx on public.penalty_rules (created_by);
create index penalty_rules_updated_by_fkey_idx on public.penalty_rules (updated_by);
create index penalty_rules_deleted_by_fkey_idx on public.penalty_rules (deleted_by);


