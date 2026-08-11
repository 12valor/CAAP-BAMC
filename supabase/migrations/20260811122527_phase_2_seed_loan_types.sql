-- Remote migration version: 20260811122527
insert into public.loan_types (
  code,
  name,
  calculation_strategy,
  calculation_parameters,
  configuration_version,
  is_active,
  sort_order
)
values
  ('GL', 'GL', 'manual', '{}'::jsonb, 1, true, 10),
  ('MPL', 'MPL', 'manual', '{}'::jsonb, 1, true, 20),
  ('EL', 'EL', 'manual', '{}'::jsonb, 1, true, 30);
