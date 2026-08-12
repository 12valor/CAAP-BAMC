# Decisions needed

These rules are intentionally unresolved. They must be confirmed with the
authorized CAAP BAMC stakeholders before schemas, calculations, imports, or
reports depend on them.

| Area | Decisions required | Status |
| --- | --- | --- |
| Loan interest | Rate source, simple or amortized method, compounding, effective dates, day-count convention, and rounding | Unconfirmed; stored strategy remains `manual` |
| Penalties | Trigger conditions, grace periods, rate or fixed amount, caps, waivers, and posting order | Unconfirmed |
| Rebates | Eligibility, formula, applicable loan types, approval process, timing, and rounding | Unconfirmed |
| Leave accrual | Accrual frequency, starting balances, carry-over, caps, expiration, adjustments, and treatment by employee status | Unconfirmed; balances currently follow posted manual ledger deltas |
| Statements and reports | Official totals, grouping, cutoff dates, opening and closing balance rules, signs, and rounding | Unconfirmed |
| Automatic schedules | Payment frequency, first due date, irregular periods, holidays, final-payment adjustment, and rescheduling rules | Unconfirmed |
| Transaction editing | Closed-period rules, approval requirements, correction method, and effect on generated schedules and statements | Unconfirmed |
| Import behavior | Required columns, duplicate keys, update versus reject rules, partial-file behavior, and row-level error reporting | Unconfirmed |

Cross-cutting decisions still needed:

- Source of truth and ownership for each configurable category.
- Currency precision, display precision, and rounding mode. Database money
  columns remain unrestricted `numeric` until this is approved.
- Accounting period close and reopening controls.
- Historical rule versioning and whether recalculation may affect posted data.
- Required retention periods for records, audit events, and attachments.
- Official PDF statement layout, signatories, and report certification text.

Until these decisions are approved, later phases must store explicitly entered
values and configuration without embedding provisional formulas.

Phase 6 exposes `manual`, `zero_interest`, and `flat_percentage` as technical
strategies only. No default CAAP rate is supplied. Penalties remain `none` or
manually adjusted with an explanation. Semi-monthly previews currently use
literal 15-day intervals until payroll cutoff and holiday rules are approved.

Phase 8-10 decisions still needed:

- Confirm the production document upload limit (25 MB application default,
  50 MB bucket hard cap), retention for archived objects, and cleanup timing
  for abandoned pending uploads.
- Confirm employee-visible defaults for every document category.
- Confirm the production opening-balance transaction type and direction rules,
  whether imported usernames are reservations, and the approved workbook row
  and processing limits.
- Confirm whether filtered statements carry a beginning balance from earlier
  transactions. Current running balances cover the selected posted rows.
- Approve official statement wording, signatories, seal/logo use, paper size,
  certification text, and reconciliation rules before PDFs are official.
