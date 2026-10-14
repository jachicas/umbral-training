@AGENTS.md

# Umbral Training — Project Context

> **Codename** (temporary). Internal dashboard for a running / triathlon coach to manage athletes, training plans, sessions, metrics, and race results. Few users, internal tool. Personal project.

## Stack

- **Web app:** Next.js (App Router) — the UI. Route Handlers and Server Actions stay thin.
- **Backend:** a separate backend API is **planned but not created yet** (as of 2026-10-14). Its stack, repo location, and hosting are still to be decided. Until it exists, the web app runs on a mock repository.
- **Database & Auth:** Supabase (Postgres + Auth + Row-Level Security). RLS is the primary authorization mechanism — each athlete sees only their own data.
- **ORM:** Drizzle (`drizzle-orm` + `drizzle-kit`). All DB access goes through repository modules, never raw queries scattered across the UI.
- **UI:** Tailwind CSS + shadcn/ui. Charts with Recharts or Tremor.
- **Language / tooling:** TypeScript, `src/` directory, import alias `@/*`, pnpm.
- **Deploy target:** Railway. Keep resource usage minimal.

## Architecture

The system is two parts: this Next.js web app and a separate backend API (planned). The domain (athletes, plans, sessions, metrics) is mostly CRUD + reporting, so:

- **Business logic belongs in the backend.** New business rules — starting with the workout pace calculation (template % of a reference time → per-athlete pace) — go in the backend API. Don't build them in this app as a stopgap; the web app consumes computed results.
- **Keep existing business logic framework-agnostic.** Domain types and business rules go in plain TypeScript under `src/lib/domain`. Use-cases go under `src/lib/services`. Route Handlers, Server Actions, and components stay thin and call into these services — they must not contain business logic.
- **Protect the dependency direction.** `domain` and `services` must not import Next.js, Drizzle, or Supabase types directly. Those concerns live behind repository interfaces / adapters.
- **Why it's structured this way:** the existing domain/services code must be movable to the backend as a lift-and-shift, without a rewrite.
- **Reversibility over "optimal."** Prefer simple, changeable decisions. Every abstraction must earn its complexity.

## Guardrails — do NOT

- Do not add services beyond the web app and the planned backend API.
- Do not add Redis, BullMQ, or any queue until there is real async work. For scheduled tasks (e.g. weekly summary emails), use a cron.
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
│   ├── db/              # Drizzle schema + repository implementations
│   └── supabase/        # Supabase client + auth helpers
```

## Commands

```bash
pnpm dev      # start the dev server (http://localhost:3000)
pnpm build    # production build
pnpm lint     # lint
```
