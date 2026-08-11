# CAAP BAMC Employee Financial Records Management System

Production-oriented employee financial records management for CAAP BAMC
Bacolod-Silay Airport.

## Phase 0 scope

This repository currently contains the application foundation only: Next.js,
TypeScript, Tailwind CSS, shadcn/ui, Supabase SSR utilities, environment
validation, route-group placeholders, and test tooling. Financial modules and
database tables are intentionally not implemented yet.

## Requirements

- Node.js 22
- npm 10 (the only supported package manager for this repository)

## Local setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local`.
3. Replace the placeholders with the Supabase project URL and publishable key.
4. Start the app with `npm run dev`.

Never place a Supabase secret or service-role key in a `NEXT_PUBLIC_*` variable.

## Quality checks

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:e2e:install` (first Playwright run only)
- `npm run test:e2e`
- `npm run build`

Architecture and security conventions are documented in
[`docs/architecture.md`](docs/architecture.md). Unresolved financial rules are
tracked in [`docs/decisions-needed.md`](docs/decisions-needed.md).
