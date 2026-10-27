@AGENTS.md

# Umbral Training — Project Context

> **Codename** (temporary). Internal dashboard for a running / triathlon coach to manage athletes, training plans, sessions, metrics, and race results. Few users, internal tool. Personal project.

## Stack

- **Web app:** Next.js (App Router) — the UI. Route Handlers and Server Actions stay thin.
- **Backend:** Laravel API in the sibling repo `../umbral-training-api` (decided 2026-10-14), deployed to Railway. Its contract is `docs/api.md` there, and its plan `docs/roadmap.md`.
- **Database & Auth:** Supabase (Postgres + Auth). The web app signs users in with Supabase Auth and calls the API server-side with the user's access token. The API owns the database and authorizes every request in code. RLS stays enabled on every table, with no policies, so the Data API can't reach them.
- **Data access:** the web app does not query the database. Repository modules in `src/lib/db/repositories` (`athletes-repo.api.ts`, `workouts-repo.api.ts`) are the only place that talks to the API, through `src/lib/api/client.ts`. There are no mocks left: everything runs on the API.
- **Auth:** `src/proxy.ts` refreshes the Supabase session, keeps signed-out visitors on `/login`, and keeps each role on its side (`app_metadata.role`, set by the API): athletes only in `/portal`, the super admin (`"admin"`) in `/admin`, the coach in neither. Invite links land on `/auth/confirm`, then `/portal/welcome` (athletes) or `/welcome` (a club's coach) to set a password. Sign-in and sign-out are Server Actions, and every Supabase/API setting is server-only (no `NEXT_PUBLIC_`).
- **Clubs:** the API's tenants. The root layout gets the signed-in user's club from `/v1/me` and paints its brand: `src/components/shell/brand.tsx` turns its palette into CSS tokens over Umbral's (`--coral`, `--on-coral` for text on it, `--club-accent`, `.club-sidebar`), and shows its logo and name once it has a logo. A suspended club's coach and athletes see a notice instead of their pages. The super admin manages clubs in `/admin`; "Ver club" sets a cookie (`src/lib/viewing.ts`) that lets them into the coach's pages, read-only, with every API call carrying `X-Club-Id` (`src/lib/api/client.ts`).
- **UI:** Tailwind CSS + shadcn/ui. Charts with Recharts or Tremor.
- **Language / tooling:** TypeScript, `src/` directory, import alias `@/*`, pnpm.
- **Deploy target:** Railway. Keep resource usage minimal.

## Architecture

The system is two parts: this Next.js web app and the Laravel API. The domain (athletes, plans, sessions, metrics) is mostly CRUD + reporting, so:

- **Business logic belongs in the backend.** New business rules — starting with the workout pace calculation (template % of a reference time → per-athlete pace) — go in the backend API. Don't build them in this app as a stopgap; the web app consumes computed results.
- **Keep existing business logic framework-agnostic.** Domain types and business rules go in plain TypeScript under `src/lib/domain`. Use-cases go under `src/lib/services`. Route Handlers, Server Actions, and components stay thin and call into these services — they must not contain business logic.
- **Protect the dependency direction.** `domain` and `services` must not import Next.js, Drizzle, or Supabase types directly. Those concerns live behind repository interfaces / adapters.
- **Why it's structured this way:** each module's domain/services code is the spec for its port to the Laravel API. Once a module migrates, its rules leave this app, and only the types and presentation stay.
- **Reversibility over "optimal."** Prefer simple, changeable decisions. Every abstraction must earn its complexity.

## Guardrails — do NOT

- Do not add services beyond the web app and the Laravel API.
- Do not add Redis, BullMQ, or another queue. The API's async work (the week's emails) runs on its database queue, in the same container. For scheduled tasks (e.g. weekly summary emails), use a cron.
- Do not put business rules inside Route Handlers, Server Actions, or React components — they belong in the backend (existing ones live in `src/lib/services` and `src/lib/domain` until they move).
- Do not introduce DDD tactical patterns (aggregates, event sourcing, CQRS) unless a concrete, present problem demands it.

## Suggested structure

```
src/
├── app/                 # Next.js routes, Server Actions, Route Handlers (thin)
├── components/          # UI (shadcn/ui)
├── lib/
│   ├── domain/          # entities + business rules (pure TS, no framework; moves to the backend)
│   ├── services/        # use-cases; orchestrate domain + repositories (moves to the backend)
│   ├── db/              # repository implementations (API adapters; mocks until migrated)
│   └── supabase/        # Supabase client + auth helpers
```

## Commands

Copy `.env.example` to `.env.local` (Supabase URL + publishable key, API URL) and run the API (`composer dev` in `../umbral-training-api`).

```bash
pnpm dev      # start the dev server (http://localhost:3000)
pnpm build    # production build
pnpm lint     # lint
```
