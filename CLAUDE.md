@AGENTS.md

# Umbral Training — Project Context

> **Codename** (temporary). Internal dashboard for a running / triathlon coach to manage athletes, training plans, sessions, metrics, and race results. Few users, internal tool. Personal project.

## Stack

- **Web app:** Next.js (App Router) — the UI. Route Handlers and Server Actions stay thin.
- **Backend:** Laravel API in the sibling repo `../umbral-training-api` (decided 2026-10-14), deployed to Railway. Its contract is `docs/api.md` there, and its plan `docs/roadmap.md`.
- **Database & Auth:** the API owns both. Logins live in its `users` table; the web app signs in against `/v1/auth/*` and calls the API server-side with the session token it gets. The database is Postgres on Railway, and receipts and club logos are on Backblaze B2, both behind the API.
- **Data access:** the web app does not query the database. Repository modules in `src/lib/db/repositories` (`athletes-repo.api.ts`, `workouts-repo.api.ts`) are the only place that talks to the API, through `src/lib/api/client.ts`. There are no mocks left: everything runs on the API.
- **Auth:** the session is the API's token and the login's role, each in an httpOnly cookie (`src/lib/session.ts`, `src/lib/auth/session.ts`); who is signed in comes from `/v1/me`, once per request (`src/lib/auth/current-user.ts`). `src/proxy.ts` keeps signed-out visitors on `/login` and each role on its side: athletes only in `/portal`, the super admin in `/admin`, the coach in neither; the role cookie only routes pages, the API authorizes every call. Invites land on `/welcome?token=…` and resets on `/reset-password?token=…` (asked for at `/forgot-password`), both to set a password. A 401 from the API goes to `/auth/expired`, which clears the cookies. Sign-in and sign-out are Server Actions, and the API URL is server-only (no `NEXT_PUBLIC_`).
- **Clubs:** the API's tenants. The root layout gets the signed-in user's club from `/v1/me` and paints its brand: `src/components/shell/brand.tsx` turns its palette into CSS tokens over Umbral's (`--coral`, `--on-coral` for text on it, `--club-accent`, `.club-sidebar`), and shows its logo and name once it has a logo. A suspended club's coach and athletes see a notice instead of their pages. The super admin manages clubs in `/admin`; "Entrar como invitado" gets a guest session from the API, a session token of the club's coach: it becomes the session (role `coach`) while theirs waits in its own cookie until "Salir" (`src/lib/auth/session.ts`), and `/v1/me` says who the guest is. They can do everything the coach can, and the API records each change for the coach, who sees the unseen ones on the dashboard (`GuestChangesCard`).
- **UI:** Tailwind CSS + shadcn/ui. Charts with Recharts or Tremor.
- **Language / tooling:** TypeScript, `src/` directory, import alias `@/*`, pnpm.
- **Deploy target:** Railway. Keep resource usage minimal.

## Architecture

The system is two parts: this Next.js web app and the Laravel API. The domain (athletes, plans, sessions, metrics) is mostly CRUD + reporting, so:

- **Business logic belongs in the backend.** New business rules — starting with the workout pace calculation (template % of a reference time → per-athlete pace) — go in the backend API. Don't build them in this app as a stopgap; the web app consumes computed results.
- **Keep existing business logic framework-agnostic.** Domain types and business rules go in plain TypeScript under `src/lib/domain`. Use-cases go under `src/lib/services`. Route Handlers, Server Actions, and components stay thin and call into these services — they must not contain business logic.
- **Protect the dependency direction.** `domain` and `services` must not import Next.js types or HTTP clients directly. Those concerns live behind repository interfaces / adapters.
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
│   └── auth/            # the session (cookies) and who is signed in
```

## Commands

Copy `.env.example` to `.env.local` (the API URL) and run the API (`composer dev` in `../umbral-training-api`).

```bash
pnpm dev      # start the dev server (http://localhost:3000)
pnpm build    # production build
pnpm lint     # lint
```
