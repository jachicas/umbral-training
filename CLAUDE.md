@AGENTS.md

# Umbral Training — Project Context

> **Codename** (temporary). Internal dashboard for a running / triathlon coach to manage athletes, training plans, sessions, metrics, and race results. Few users, internal tool. Personal project.

## Stack

- **Framework:** Next.js (App Router) — full-stack in a single app. UI + backend live together via Route Handlers and Server Actions. There is no separate backend service.
- **Database & Auth:** Supabase (Postgres + Auth + Row-Level Security). RLS is the primary authorization mechanism — each athlete sees only their own data.
- **ORM:** Drizzle (`drizzle-orm` + `drizzle-kit`). All DB access goes through repository modules, never raw queries scattered across the UI.
- **UI:** Tailwind CSS + shadcn/ui. Charts with Recharts or Tremor.
- **Language / tooling:** TypeScript, `src/` directory, import alias `@/*`, pnpm.
- **Deploy target:** Railway — a single container. Keep resource usage minimal.

## Architecture

This is a **modular monolith**, on purpose. The domain (athletes, plans, sessions, metrics) is mostly CRUD + reporting, so:

- **Keep business logic framework-agnostic.** Domain types and business rules go in plain TypeScript under `src/lib/domain`. Use-cases go under `src/lib/services`. Route Handlers, Server Actions, and components stay thin and call into these services — they must not contain business logic.
- **Protect the dependency direction.** `domain` and `services` must not import Next.js, Drizzle, or Supabase types directly. Those concerns live behind repository interfaces / adapters.
- **Why it's structured this way:** it keeps the door open to extract a standalone NestJS API later (for scale or portfolio) as a lift-and-shift, without a rewrite. The separation is done with folders, not a monorepo.
- **Reversibility over "optimal."** Prefer simple, changeable decisions. Every abstraction must earn its complexity.

## Guardrails — do NOT

- Do not split the app into multiple services or a monorepo. One Next.js app.
- Do not add Redis, BullMQ, or any queue until there is real async work. For scheduled tasks (e.g. weekly summary emails), use a cron.
- Do not put business rules inside Route Handlers, Server Actions, or React components — those belong in `src/lib/services` and `src/lib/domain`.
- Do not introduce DDD tactical patterns (aggregates, event sourcing, CQRS) unless a concrete, present problem demands it.

## Suggested structure

```
src/
├── app/                 # Next.js routes, Server Actions, Route Handlers (thin)
├── components/          # UI (shadcn/ui)
├── lib/
│   ├── domain/          # entities + business rules (pure TS, no framework)
│   ├── services/        # use-cases; orchestrate domain + repositories
│   ├── db/              # Drizzle schema + repository implementations
│   └── supabase/        # Supabase client + auth helpers
```

## Commands

```bash
pnpm dev      # start the dev server (http://localhost:3000)
pnpm build    # production build
pnpm lint     # lint
```
