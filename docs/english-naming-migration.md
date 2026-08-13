# Plan: migrate all code naming to English

> **Status:** ready to implement. Nothing has been changed yet.
> **Scope:** naming only — routes, folders, files, identifiers, union/enum values, comments.
> **Out of scope:** Spanish user-facing copy (see [Explicitly out of scope](#explicitly-out-of-scope)).

## 0. Context for the implementer

`umbral-training` is a Next.js (App Router) internal dashboard for a running / triathlon / gym coach.
Read `CLAUDE.md` and `AGENTS.md` first. Two things from them that matter here:

- **`AGENTS.md`:** this Next.js version has breaking changes vs. common training data. Read the relevant guide
  in `node_modules/next/dist/docs/` before writing routing code. That AGENTS.md block is re-written by
  `next dev`; if it shows up dirty in the diff, commit it with the work.
- **`CLAUDE.md`:** modular monolith. `src/lib/domain` and `src/lib/services` stay framework-agnostic.
  This migration must not move logic between layers — it only renames things.

**The convention being enforced:** everything in the codebase is written in English — URL segments, folder and
file names, component / function / variable names, type and union values, form field names, and comments.
The product UI is Spanish on purpose (`<html lang="es">` in [`src/app/layout.tsx`](../src/app/layout.tsx));
Spanish is allowed **only** inside user-facing strings.

The first feature (athletes) was built before the convention was stated, so it mixes both languages. This plan
fixes it. Current state as measured: `atletas` appears **52 times across 19 files**.

**Nothing here is persisted yet.** There is no Drizzle schema and no Supabase table — the only data source is
the in-memory mock [`src/lib/db/repositories/athletes-repo.mock.ts`](../src/lib/db/repositories/athletes-repo.mock.ts).
So **no DB migration is needed**, including for the enum value renames in Phase 3. If a schema exists by the
time you read this, re-check Phase 3 before touching those values.

### The one real risk

Route strings are **strings**, not types. `revalidatePath("/atletas")`, `redirect(...)`, and `href="..."` will
compile fine after a bad rename and break navigation at runtime. `pnpm build` will **not** catch it. That is why
Phase 5 (verification) walks the real routes in a browser, and why the guard greps in Phase 6 are mandatory.

The second trap: a blind `sed s/atletas/athletes/` would also translate Spanish UI copy. Three lines contain
`atletas` inside user-facing strings and **must stay Spanish** — they are listed in Phase 1.4.

## 1. Phase 1 — routes, folders, component names

### 1.1 Rename the directories (use `git mv` so history follows)

```bash
git mv src/app/atletas src/app/athletes && git mv src/app/athletes/nuevo src/app/athletes/new && git mv src/components/atletas src/components/athletes
```

Resulting tree:

```
src/app/athletes/
├── [id]/page.tsx
├── actions.ts
├── layout.tsx
├── new/page.tsx          (was nuevo/)
└── page.tsx

src/components/athletes/  (22 files, incl. fields/ subfolder — no per-file renames needed,
                           every filename is already English: AthleteRow.tsx, EditGoalDialog.tsx, …)
```

New URLs: `/athletes`, `/athletes/new`, `/athletes/[id]`.

### 1.2 Rename the three Spanish component functions

| File | Current | New |
|---|---|---|
| `src/app/athletes/layout.tsx:6` | `AtletasLayout` | `AthletesLayout` |
| `src/app/athletes/page.tsx:12` | `AtletasPage` | `AthletesPage` |
| `src/app/athletes/new/page.tsx:8` | `NuevoAtletaPage` | `NewAthletePage` |

All three are `export default`, so no call sites to update.

### 1.3 Update every import path

- `@/components/atletas/...` → `@/components/athletes/...`
- `@/app/atletas/actions` → `@/app/athletes/actions`

Affected files (import-only changes): `src/app/athletes/[id]/page.tsx` (10 component imports),
`src/app/athletes/page.tsx`, `src/app/athletes/new/page.tsx`, and inside `src/components/athletes/`:
`AddRecordDialog.tsx`, `CreateAthleteForm.tsx`, `EditAthleteDialog.tsx`, `EditGoalDialog.tsx`,
`EditMembershipDialog.tsx`, `EditSportProfileDialog.tsx`, `InviteAccessControl.tsx`, `fields/FormDialog.tsx`.

TypeScript **will** catch a missed import (`@/*` → `./src/*` per `tsconfig.json`). Run `pnpm build` to confirm.

### 1.4 Update route strings — the part TypeScript cannot check

| File | What to change |
|---|---|
| `src/app/athletes/actions.ts` | 16 occurrences: every `revalidatePath("/atletas")`, `revalidatePath(\`/atletas/${athleteId}\`)`, and the `redirect(\`/atletas/${athleteId}\`)` at line 90 |
| `src/app/athletes/[id]/page.tsx:78` | back link `href="/atletas"` |
| `src/app/athletes/new/page.tsx:12` | back link `href="/atletas"` |
| `src/components/athletes/AthleteRow.tsx:17` | `href={\`/atletas/${a.id}\`}` |
| `src/components/athletes/AddAthleteButton.tsx:10` | `href="/atletas/nuevo"` → `/athletes/new` |
| `src/components/athletes/CreateAthleteForm.tsx:107` | cancel link `href="/atletas"` |
| `src/components/shell/nav.ts:16` | `href: "/atletas"` |
| `src/app/page.tsx:476` | `router.push("/atletas")` |

**Do NOT touch these three — Spanish UI copy, intentional:**

- `src/app/layout.tsx:15` — metadata description `"…gestiona atletas, entrenos, métricas y carreras."`
- `src/app/page.tsx:507` — `placeholder="Buscar atletas, entrenos, carreras…"`
- `src/components/shell/AppShell.tsx:144` — same placeholder

Also leave the visible `label: "Atletas"` values alone (Phase 2 renames the `id`, not the `label`).

## 2. Phase 2 — the `NavId` union

[`src/components/shell/nav.ts:4`](../src/components/shell/nav.ts) currently:

```ts
export type NavId = "dashboard" | "atletas" | "entrenos" | "pagos" | "ajustes";
```

Rename the values (keep `dashboard`), labels stay Spanish:

| Current id | New id | Label (unchanged) |
|---|---|---|
| `atletas` | `athletes` | `"Atletas"` |
| `entrenos` | `workouts` | `"Entrenos"` |
| `pagos` | `payments` | `"Pagos"` |
| `ajustes` | `settings` | `"Ajustes"` |

`workouts` (not `trainings`/`sessions`) because the domain already uses that term:
`AssignedWorkout` in [`src/lib/domain/types.ts:88`](../src/lib/domain/types.ts).

Call sites to update:

- `src/components/shell/nav.ts:16-19` — the `id` field of each `NAV_ITEMS` entry
- `src/app/athletes/layout.tsx:8` — `<AppShell active="atletas">` → `active="athletes"`
- `src/app/page.tsx:322-328` — a **duplicated, independent** nav array in the legacy prototype screen
  (`{ id: "atletas", … }`, `{ id: "entrenos", … }`, `{ id: "pagos", … }`, `{ id: "ajustes", … }`) plus
  `const activeId = … ? "entrenos" : "dashboard"` on line 328
- `src/app/page.tsx:475` — `else if (n.id === "entrenos") go("constructor")`
- `src/app/page.tsx:476` — `else if (n.id === "atletas") router.push(…)`

`src/components/shell/AppShell.tsx` needs no edit: it consumes `NavId` generically (line 16) and its only
`atletas` hit is the Spanish placeholder on line 144.

> Note: `src/app/page.tsx` is a large prototype screen with its own local `Screen`/`Disc` types and its own nav
> array. It is not wired to `nav.ts`. Rename its ids anyway so both lists agree, but do not attempt to unify
> the two navs — that is a separate refactor.

## 3. Phase 3 — Spanish values inside domain unions

These are the **only** Spanish values in the domain layer. Everything else is already English
(`swim|bike|run|gym`, `draft|invited|linked`, `paid|pending|overdue|waived`, and all form field names such as
`fullName`, `raceDate`, `maxHr`).

| File / line | Current | New |
|---|---|---|
| `src/lib/domain/types.ts:58` | `RunningFormat = "5k" \| "10k" \| "21k" \| "42k" \| "otro"` | `"otro"` → `"other"` |
| `src/lib/domain/types.ts:59` | `TriathlonFormat = "sprint" \| "olimpico" \| "70.3" \| "140.6" \| "otro"` | `"olimpico"` → `"olympic"`, `"otro"` → `"other"` |
| `src/lib/domain/goals.ts:14` | `otro: "Otro",` (in `RUNNING_FORMAT_LABEL`) | key → `other`, label stays `"Otro"` |
| `src/lib/domain/goals.ts:19` | `olimpico: "Olímpico",` | key → `olympic`, label stays `"Olímpico"` |
| `src/lib/domain/goals.ts:22` | `otro: "Otro",` (in `TRIATHLON_FORMAT_LABEL`) | key → `other`, label stays `"Otro"` |
| `src/lib/db/repositories/athletes-repo.mock.ts:82` | `format: "olimpico"` | `format: "olympic"` |

The label records are typed `Record<RunningFormat, string>` / `Record<TriathlonFormat, string>`, so TypeScript
catches a mismatch. `formatsFor()` in `goals.ts` derives `<select>` option values from those keys via
`Object.entries`, so the form values follow automatically — no change needed in
`src/components/athletes/fields/GoalFields.tsx`.

Confirm afterwards that nothing else compares against the old values:

```bash
grep -rn '"olimpico"\|"otro"\|olimpico\|\botro\b' src/
```

## 4. Phase 4 — comments

### 4.1 Fully Spanish JSX section comments — translate

All in [`src/app/athletes/[id]/page.tsx`](../src/app/athletes/[id]/page.tsx):

| Line | Current | Suggested |
|---|---|---|
| 142 | `{/* marcas de carrera */}` | `{/* race records */}` |
| 197 | `{/* entrenos asignados */}` | `{/* assigned workouts */}` |
| 238 | `{/* objetivo */}` | `{/* goal */}` |
| 315 | `{/* membresía */}` | `{/* membership */}` |
| 385 | `{/* perfil deportivo */}` | `{/* sport profile */}` |

### 4.2 English comments borrowing Spanish domain nouns — reword

Replace the borrowed noun, keep the comment's meaning and length. Glossary:
`cuota` → *fee* / *agreed fee*, `ficha` → *athlete profile*, `entreno` → *workout*,
`pendiente(s)` → *pending*, `"Añadir atleta"` → *"add athlete"*, `"Perfil deportivo"` → *sport profile*.

| File | Line | Contains |
|---|---|---|
| `src/components/athletes/AthleteExplorer.tsx` | 62 | `cuota`, `"pendiente"` |
| `src/components/athletes/types.ts` | 12 | `cuota` |
| `src/components/athletes/CreateAthleteForm.tsx` | 44 | `ficha` |
| `src/components/athletes/AddAthleteButton.tsx` | 6 | `"Añadir atleta"` |
| `src/components/athletes/fields/AthleteIdentityFields.tsx` | 16 | `"Editar atleta"` |
| `src/components/athletes/fields/SportProfileFields.tsx` | 19 | `ficha`, `"Perfil deportivo"` |
| `src/components/athletes/fields/GoalFields.tsx` | 18 | `"Carrera"` |
| `src/lib/domain/repositories.ts` | 68 | `ficha` |
| `src/lib/domain/goals.ts` | 37, 44 | `ficha`; `"Carrera Maratón de Valencia"` / `"Mantenimiento"` |
| `src/lib/domain/payments.ts` | 25, 39 | `"Pendiente"`; `"Pendientes"` |
| `src/lib/services/athletes.ts` | 130, 180 | `ficha` (×2) |

Where the comment quotes a **literal Spanish string that still exists in the code** (e.g. `payments.ts:25`
explaining why a status must not read `"Pendiente"`), keep the quoted literal as-is and put the surrounding
prose in English — the quote is a reference to real UI text, not Spanish prose.

## 5. Phase 5 — verification

Do all of it. `pnpm build` alone is not sufficient (route strings are untyped).

1. `pnpm lint`
2. `pnpm build` — catches every broken import and enum mismatch
3. Restart the dev server so the App Router re-scans the renamed route folders. **Use the preview tool, not
   `bash`:** `preview_start` with `{name: "umbral-dev"}` (defined in `.claude/launch.json`, port 3000).
   If a stale route shows up, delete `.next/` and start again.
4. Walk the real routes and confirm no 404 and no console errors:
   - `/athletes` — list renders, athlete count row renders
   - click a row → `/athletes/[id]` — detail renders, back link returns to `/athletes`
   - `/athletes/new` — form renders, cancel link returns to `/athletes`
   - sidebar: "Atletas" navigates to `/athletes`; the active item highlights on athlete routes
     (this is the `active="athletes"` prop from Phase 2)
5. Exercise a Server Action that revalidates — e.g. edit the goal or the membership from the detail page — and
   confirm the page reflects the change. A stale `revalidatePath("/atletas")` fails silently: no error, just no
   refresh. Check `read_console_messages` and `preview_logs` too.
6. Confirm the goal form still works end to end with the renamed enum values: pick modality *Triatlón* →
   format *Olímpico*, save, reopen. Same for a running goal with *Otro*.

## 6. Phase 6 — guard greps

All of these must return **only** the three intentional Spanish-copy lines from Phase 1.4:

```bash
grep -rn "atletas\|Atletas" src/ --include="*.ts" --include="*.tsx"
```

These must return nothing:

```bash
grep -rn "nuevo\|AtletasPage\|NuevoAtletaPage\|AtletasLayout" src/ --include="*.ts" --include="*.tsx"
```

```bash
grep -rniE "\"(entrenos|pagos|ajustes)\"|\bolimpico\b|\botro\b" src/ --include="*.ts" --include="*.tsx"
```

## 7. Commit

One branch, and split the commits so the risky rename is isolated and revertable:

1. `refactor: rename athletes routes and folders to English` (Phases 1–2)
2. `refactor: use English values for goal format unions` (Phase 3)
3. `chore: write all code comments in English` (Phase 4)

`git mv` keeps the rename detectable; verify with `git status` that the moves show as `R` and not as
delete + add. Do not commit `.next/` or `tsconfig.tsbuildinfo`.

## Explicitly out of scope

Do not do these as part of this migration.

- **Spanish UI copy.** All visible text stays Spanish — labels, placeholders, dialog titles, metadata titles
  and descriptions, `<html lang="es">`. No i18n layer is being introduced.
- **Spanish copy living inside `domain` / `services`.** Known and deliberately deferred: ~12 Spanish
  validation messages in [`src/lib/services/athletes.ts`](../src/lib/services/athletes.ts) (lines 102, 110,
  142, 189, 195, 221, 250, 253, 262, 316, 347), the label maps in
  [`src/lib/domain/discipline.ts`](../src/lib/domain/discipline.ts),
  [`src/lib/domain/goals.ts`](../src/lib/domain/goals.ts) (incl. `goalSummaryLabel` returning
  `"Mantenimiento"` / `"Carrera · …"`), [`src/lib/domain/payments.ts`](../src/lib/domain/payments.ts), and the
  thrown message in `athletes-repo.mock.ts:195`. This conflicts with the framework-agnostic rule in
  `CLAUDE.md` and should become error codes + a presentation-layer label module — as its own task.
- **Spanish docs.** [`docs/PRD.md`](PRD.md) and [`docs/design-prompt.md`](design-prompt.md) are prose, not
  code. They stay Spanish.
- **Unifying the two nav arrays** or otherwise refactoring the `src/app/page.tsx` prototype. Rename its ids,
  change nothing else.
