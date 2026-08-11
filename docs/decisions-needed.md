# Decisions needed

These rules are intentionally unresolved. They must be confirmed with the
authorized CAAP BAMC stakeholders before schemas, calculations, imports, or
reports depend on them.

| Area | Decisions required | Status |
| --- | --- | --- |
| Loan interest | Rate source, simple or amortized method, compounding, effective dates, day-count convention, and rounding | Unconfirmed |
| Penalties | Trigger conditions, grace periods, rate or fixed amount, caps, waivers, and posting order | Unconfirmed |
| Rebates | Eligibility, formula, applicable loan types, approval process, timing, and rounding | Unconfirmed |
| Leave accrual | Accrual frequency, starting balances, carry-over, caps, expiration, adjustments, and treatment by employee status | Unconfirmed |
| Statements and reports | Official totals, grouping, cutoff dates, opening and closing balance rules, signs, and rounding | Unconfirmed |
| Automatic schedules | Payment frequency, first due date, irregular periods, holidays, final-payment adjustment, and rescheduling rules | Unconfirmed |
| Transaction editing | Closed-period rules, approval requirements, correction method, and effect on generated schedules and statements | Unconfirmed |
| Import behavior | Required columns, duplicate keys, update versus reject rules, partial-file behavior, and row-level error reporting | Unconfirmed |

Cross-cutting decisions still needed:

- Source of truth and ownership for each configurable category.
- Currency precision, display precision, and rounding mode.
- Accounting period close and reopening controls.
- Historical rule versioning and whether recalculation may affect posted data.
- Required retention periods for records, audit events, and attachments.
- Official PDF statement layout, signatories, and report certification text.

Until these decisions are approved, later phases must store explicitly entered
values and configuration without embedding provisional formulas.
