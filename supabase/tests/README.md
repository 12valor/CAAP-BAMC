# Database tests

Add pgTAP or equivalent database tests alongside the first schema migration.
Every exposed table must have tests that prove anonymous access is denied and
that employees cannot read or mutate another employee's rows.
