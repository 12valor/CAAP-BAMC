# Architecture

## Scope

Phases 0 and 1 establish project conventions and the shared application shell.
Phase 2 adds the database, authorization, and audit foundation. Phase 3 adds
authentication and administrator-managed accounts without adding financial
business modules, Storage buckets, or calculation formulas.

## Runtime and application framework

- Node.js is pinned to the supported `22.x` line in `package.json`, `.nvmrc`,
  and `.node-version`.
- npm is the single package manager. `package-lock.json` is the only lockfile.
- Next.js uses the App Router under `src/app` with strict TypeScript.
- Tailwind CSS provides token-based styling. shadcn/ui source components use
  Radix primitives and Lucide icons.
- The product is light-only. No theme switcher or dark-mode provider is used.

## Source layout

```text
src/
  app/
    (auth)/       Public authentication routes
    (admin)/      Bookkeeper and administrator routes
    (employee)/   Employee self-service routes
  components/
    feedback/     Loading, empty, success, and error presentation
    layout/       Shared page and application shells
    patterns/     Reusable table, filter, dialog, and summary patterns
    preview/      Phase-specific visual previews without business behavior
    ui/           shadcn/ui source components
  config/         Typed application navigation and static configuration
  fixtures/       Isolated synthetic data used only for design previews
  lib/
    permissions/  Server authorization helpers and conventions
    supabase/     Browser, server, and proxy clients
    utils.ts      Shared presentation utilities
  tests/          Unit and component-test setup
  types/          Shared application and generated database types
  validation/     Zod schemas used at trust boundaries
tests/e2e/        Playwright critical-flow tests
supabase/
  migrations/     Versioned database changes, introduced when needed
  tests/          RLS and database behavior tests
```

Route groups organize code but do not authorize requests. Every protected page,
Server Action, and Route Handler must validate the signed-in identity and role
on the server. Every mutation must repeat authorization at the mutation
boundary.

Phase 1 route placeholders are intentionally nonfunctional. Preview components
may import from `src/fixtures`, but future database clients, actions, services,
and repositories must not import fixture data.

## Supabase boundary

- Client Components use `src/lib/supabase/client.ts`.
- Server Components, Server Actions, and Route Handlers use
  `src/lib/supabase/server.ts`.
- Next.js 16 uses the root `proxy.ts` and
  `src/lib/supabase/proxy.ts` to refresh cookie-backed sessions.
- Server authorization must use validated claims or a fresh user lookup. It
  must not trust `getSession()` or `user_metadata` for authorization.
- Only the project URL and publishable key are accepted by browser code.
  Secret and service-role keys are intentionally absent from the public schema.
- The future document bucket must be private and accessed through short-lived
  signed URLs after server-side authorization.

## Authentication and account management

- The sign-in form accepts a normalized username. A server-only mapping resolves
  it to a generated internal Auth email identifier; neither the mapping nor an
  employee-directory search is available to browser roles.
- Supabase Auth remains the only password store. Generated passwords are returned
  once by the account action and kept only in transient client state until the
  administrator dismisses them. Existing passwords cannot be retrieved.
- `profiles.role` and account status are checked afresh on the server for every
  protected layout, action, and route handler. The proxy refreshes cookies and
  provides an early redirect, but it is not an authorization boundary.
- Active administrators enter at `/admin/dashboard`; active employees enter at
  `/portal/overview`. A user who requests the other role's route is redirected
  to their own role home.
- Disabling an account sets both the application profile status and a long-lived
  Supabase Auth ban. Database RLS checks the active profile immediately, so an
  already-issued access token cannot continue reading protected records.
- Login protection counts HMAC-pseudonymized username and network fingerprints
  in a 15-minute window. It permits five failed attempts per username and twenty
  per network before failing closed. Raw usernames, IP addresses, and passwords
  are never written to login activity.
- Account creation, password reset, and status changes use server-only Supabase
  secret-key clients plus service-only database RPCs. Security actions append
  audit records with reasons; passwords never enter an audit snapshot.
- The first administrator is created by the one-time `bootstrap:admin` script.
  The script refuses to run after an administrator exists and prints a generated
  password only once.

## Database ownership and authorization

- `profiles.id` is the one-to-one application identity for `auth.users.id`.
  `profiles.role` is the canonical `admin | employee` authorization source;
  authorization never reads `user_metadata`.
- `employee_profiles.profile_id` is nullable and unique so imported employee
  records can exist before an Auth account is provisioned.
- Every public table has RLS enabled. Anonymous users receive no Data API table
  privileges. Employees receive read-only policies scoped through their linked
  employee record. Administrators receive managed select, insert, and update
  policies, but no hard-delete policy or privilege.
- Private, fixed-search-path helper functions resolve the current employee and
  administrator role. They validate `auth.uid()` and expose only narrowly
  granted execution rights.
- Application mutations must still perform server-side authorization; RLS is a
  mandatory second boundary, not a replacement for mutation checks.

## Data lifecycle and audit

- Mutable records carry creator/updater and soft-deletion metadata. Deletion
  requires a reason, and database triggers reject physical deletion.
- `audit_logs` is an ordered bigint append-only ledger. Triggered create,
  update, soft-delete, restore, and settings-change events record actor, table,
  record identifier, old/new JSON snapshots, reason, and `timestamptz`.
- Password resets and account status changes are recorded by trusted Phase 3
  workflows. Import audit actions remain reserved for a later phase. Normal
  application roles cannot insert, update, or delete audit rows; administrators
  can only select them.
- Leave balances are derived from posted leave-ledger deltas. Phase 2 does not
  calculate accruals.

## Financial configuration and pagination

- Money uses unrestricted PostgreSQL `numeric` until currency scale and
  rounding are approved. Time-bearing lifecycle and audit fields use
  `timestamptz`; business-effective dates use `date`.
- Configurable rules use an identifier-style `calculation_strategy`, JSON-object
  parameters, and a configuration version. The current strategy is `manual`;
  no configuration contains executable SQL or JavaScript.
- GL, MPL, and EL are editable rows in `loan_types`, not application enums.
- Lists use stable `(business_date, id)` or equivalent descending keyset
  cursors backed by partial indexes that exclude soft-deleted rows. OFFSET
  pagination is not part of the application convention.
- Database changes are delivered as ordered migrations. `src/types/database.ts`
  is generated from the applied public schema.
- No business formula is implemented until its inputs, rounding, effective
  dates, and exceptions are approved.

## Testing strategy

- Vitest covers pure utilities and Zod validation.
- React Testing Library covers accessible component behavior.
- Playwright covers protected-route redirects and role isolation. Authenticated
  cases require isolated E2E accounts supplied through environment variables;
  they skip rather than create test identities in a connected project.
- Supabase database tests (pgTAP or equivalent) accompany every RLS policy.
- Required delivery checks are lint, type checking, unit/component tests, and a
  production build. Schema phases also run database and RLS tests.
