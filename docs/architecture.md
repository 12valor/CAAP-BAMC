# Architecture

## Scope

Phase 0 establishes project conventions only. It does not define financial
tables, calculations, imports, document workflows, or account-management
screens.

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
    ui/           shadcn/ui source components
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

## Database conventions for future phases

- Every exposed table must enable RLS before access is granted.
- Employee policies must bind rows to the authenticated employee identity.
- Financial amounts use PostgreSQL `numeric`, never floating-point types.
- Time-bearing columns use `timestamptz`.
- Financial records use soft deletion. Restore and soft-delete operations must
  create audit entries; permanent-delete actions are not permitted.
- Database changes are delivered as ordered migrations. Generated TypeScript
  database types replace the Phase 0 placeholder after the first schema phase.
- No business formula is implemented until its inputs, rounding, effective
  dates, and exceptions are approved.

## Testing strategy

- Vitest covers pure utilities and Zod validation.
- React Testing Library covers accessible component behavior.
- Playwright covers critical authenticated flows when those flows exist.
- Supabase database tests (pgTAP or equivalent) accompany every RLS policy.
- Required delivery checks are lint, type checking, unit/component tests, and a
  production build. Schema phases also run database and RLS tests.
