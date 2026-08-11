# Database tests

The numbered pgTAP files cover schema and grants, anonymous/employee/admin RLS,
financial integrity and auditing, and Phase 3 account security.

Each file starts a transaction and ends with `rollback`, so synthetic identities
and records are never retained. Run the files in numeric order against an
approved local, branch, or connected test database. Do not run them concurrently
because they set transaction-local JWT claims and use fixed synthetic UUIDs.
