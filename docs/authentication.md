# Authentication operations

## Required server environment

Copy the names from `.env.example` into `.env.local`. Phase 3 requires a current
Supabase secret key and a random rate-limit secret of at least 32 characters.
Neither value may use a `NEXT_PUBLIC_` prefix or be passed to Client Components.

## Bootstrap the first administrator

Set `BOOTSTRAP_ADMIN_USERNAME` and `BOOTSTRAP_ADMIN_DISPLAY_NAME`, then run:

```powershell
npm run bootstrap:admin
```

The command refuses to create a second administrator. It prints the generated
password once; copy it directly into the approved credential-delivery channel.
The application and audit logs cannot retrieve it later.

## Employee accounts

An administrator creates an account from `/admin/employees` for an existing,
unlinked employee record. The administrator may enter a compliant password or
leave it blank to generate one. A generated password remains visible only in the
current browser state until dismissed or the page is left.

Password resets require a reason and replace the password in Supabase Auth. The
old password is never returned. Enable and disable actions require a reason and
update both Auth and the canonical application profile.

## Isolated authenticated E2E tests

The E2E suite never provisions persistent users. Point the following variables
at approved synthetic accounts in a disposable or dedicated test project:

```text
E2E_ADMIN_USERNAME
E2E_ADMIN_PASSWORD
E2E_EMPLOYEE_A_USERNAME
E2E_EMPLOYEE_A_PASSWORD
E2E_EMPLOYEE_A_ID
E2E_EMPLOYEE_B_ID
```

Run `npm run test:e2e`. Without those values, the unauthenticated redirect and
public-shell tests still run while authenticated cases report as skipped.

## Security notes

- Do not place the Supabase secret key or rate-limit secret in Vercel preview
  logs, browser code, screenshots, or committed environment files.
- Do not use real employee records for automated tests.
- Login activity stores outcome, timestamp, user agent, and keyed fingerprints;
  it intentionally does not store raw usernames or network addresses.
- Treat a password reset that reports an audit failure as an operational
  incident: the password may already have changed even though the audit append
  failed.
