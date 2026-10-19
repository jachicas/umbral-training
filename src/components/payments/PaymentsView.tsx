"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, HandCoins, Wallet, type LucideIcon } from "lucide-react";
import { FilterSelect, type FilterOption } from "@/components/ui/filter-select";
import {
  dueLabel,
  formatMoney,
  formatMonthlyAmount,
  formatTotals,
  isMembershipConfigured,
  isPayActionable,
  membershipDisplayMeta,
  monthName,
  type PaymentsAthlete,
  type PaymentsOverview,
} from "@/lib/domain/payments";
import { formatDateEs } from "@/lib/domain/time";
import { SettleButtons } from "./SettleButtons";

type Standing = "overdue" | "pending" | "unconfigured" | "upToDate" | "free" | "archived";
type Filter = "all" | "owing" | Standing;

const FILTERS: FilterOption<Filter>[] = [
  { value: "all", label: "Todos" },
  { value: "owing", label: "Por cobrar" },
  { value: "overdue", label: "Vencidos" },
  { value: "upToDate", label: "Al día" },
  { value: "unconfigured", label: "Sin configurar" },
  { value: "free", label: "Gratis" },
  { value: "archived", label: "Archivados" },
];

/** Most urgent first: who's late, who owes this month, who has no fee yet. */
const ORDER: Standing[] = ["overdue", "pending", "unconfigured", "upToDate", "free", "archived"];

function standingOf(a: PaymentsAthlete): Standing {
  const m = a.membership;
  if (m.currentPeriodStatus === "overdue") return "overdue";
  if (m.periodsOwed > 0) return "pending";
  if (a.status === "archived") return "archived";
  if (!isMembershipConfigured(m)) return "unconfigured";
  if (m.mode === "free") return "free";
  return "upToDate";
}

function matches(filter: Filter, standing: Standing, a: PaymentsAthlete): boolean {
  if (filter === "all") return true;
  if (filter === "owing") return standing === "overdue" || standing === "pending";
  if (filter === "archived") return a.status === "archived";
  return standing === filter;
}

const cardClass = "min-w-0 rounded-[18px] border p-5 shadow-[var(--shadow)]";
const cardStyle = { background: "var(--surface)", borderColor: "var(--border)" };

function Kpi({ icon: Icon, value, label, note, tone }: {
  icon: LucideIcon;
  value: string;
  label: string;
  note?: string;
  tone?: "danger";
}) {
  return (
    <div className={cardClass} style={cardStyle}>
      <div
        className="flex size-10 items-center justify-center rounded-xl"
        style={tone === "danger" ? { background: "rgba(220,38,38,.1)", color: "var(--danger)" } : { background: "var(--coral-tint)", color: "var(--coral)" }}
      >
        <Icon size={19} />
      </div>
      <div className="mt-3.5 truncate text-[22px] leading-tight font-extrabold tracking-[-.6px] tabular-nums sm:text-[28px]">{value}</div>
      <div className="mt-0.5 text-[13px]" style={{ color: "var(--text-2)" }}>
        {label}
      </div>
      {note && (
        <div className="mt-1 text-[12px] font-semibold" style={{ color: "var(--text-3)" }}>
          {note}
        </div>
      )}
    </div>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const GRID = "lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_.8fr_.8fr_.8fr_.6fr_150px] lg:items-center lg:gap-4";

/** The coach's collections: totals from the API, then every athlete's standing. */
export function PaymentsView({ overview }: { overview: PaymentsOverview }) {
  const [filter, setFilter] = useState<Filter>("all");
  const { summary } = overview;

  const rows = useMemo(
    () =>
      overview.athletes
        .map((a) => ({ athlete: a, standing: standingOf(a) }))
        .sort((x, y) => ORDER.indexOf(x.standing) - ORDER.indexOf(y.standing)),
    [overview.athletes]
  );
  const shown = rows.filter((r) => matches(filter, r.standing, r.athlete));

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          icon={Wallet}
          value={formatTotals(summary.owed)}
          label="por cobrar"
          note={summary.owingCount ? plural(summary.owingCount, "atleta", "atletas") : "Nadie debe"}
        />
        <Kpi
          icon={AlertTriangle}
          value={formatTotals(summary.overdue)}
          label="vencido"
          note={summary.overdueCount ? plural(summary.overdueCount, "atrasado", "atrasados") : "Nada atrasado"}
          tone={summary.overdueCount ? "danger" : undefined}
        />
        <Kpi icon={HandCoins} value={formatTotals(summary.collected)} label={`cobrado en ${monthName(overview.month)}`} />
        <Kpi
          icon={CalendarClock}
          value={formatTotals(summary.expected)}
          label="esperado al mes"
          note={summary.unconfiguredCount ? `${plural(summary.unconfiguredCount, "atleta", "atletas")} sin cuota` : undefined}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect label="Estado" value={filter} defaultValue="all" options={FILTERS} onChange={setFilter} />
      </div>

      {shown.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed px-4 py-14 text-center"
          style={{ borderColor: "var(--border-2)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            {overview.athletes.length === 0 ? "Aún no tienes atletas." : "Ningún atleta en este estado."}
          </p>
          {filter !== "all" && (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="h-9 rounded-[8px] border px-3.5 text-[13px] font-bold transition-colors hover:bg-[var(--surface-2)]"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Ver todos
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div
            className={`hidden px-5 py-2.5 text-[11.5px] font-semibold tracking-[.03em] uppercase ${GRID}`}
            style={{ background: "var(--surface-2)", color: "var(--text-3)" }}
          >
            <span>Atleta</span>
            <span>Estado</span>
            <span>Debe</span>
            <span>Vence</span>
            <span>Último pago</span>
            <span>Cuota</span>
            <span />
          </div>
          {shown.map(({ athlete }, i) => (
            <PaymentRow key={athlete.athleteId} athlete={athlete} first={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentRow({ athlete: a, first }: { athlete: PaymentsAthlete; first: boolean }) {
  const m = a.membership;
  const meta = membershipDisplayMeta(m);
  const overdue = m.currentPeriodStatus === "overdue";

  return (
    <div
      className={`flex flex-col gap-2 px-5 py-3.5 text-[13.5px] ${GRID}`}
      style={first ? undefined : { borderTop: "1px solid var(--border)" }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href={`/athletes/${a.athleteId}`}
          className="truncate font-semibold transition-colors hover:text-[var(--coral)]"
          style={{ color: "var(--text)" }}
        >
          {a.fullName}
        </Link>
        {a.status === "archived" && (
          <span
            className="flex-none rounded-md px-1.5 py-0.5 text-[11px] font-bold"
            style={{ background: "var(--surface-3)", color: "var(--text-2)" }}
          >
            Archivado
          </span>
        )}
      </div>

      <div className="flex min-w-0 items-center">
        <span
          className="inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-bold"
          style={{ background: meta.bg, color: meta.colorVar }}
        >
          {meta.label}
        </span>
      </div>

      <Cell label="Debe">
        {m.periodsOwed > 0 ? (
          <span className="font-bold tabular-nums" style={overdue ? { color: "var(--danger)" } : undefined}>
            {formatMoney(m.amountOwed, m.currency)}
          </span>
        ) : (
          <Muted>—</Muted>
        )}
      </Cell>

      <Cell label={m.dueOn ? dueLabel(m) : "Vence"}>
        {m.dueOn ? (
          <span style={overdue ? { color: "var(--danger)", fontWeight: 600 } : undefined}>{formatDateEs(m.dueOn)}</span>
        ) : (
          <Muted>—</Muted>
        )}
      </Cell>

      <Cell label="Último pago">{a.lastPaidOn ? formatDateEs(a.lastPaidOn) : <Muted>—</Muted>}</Cell>

      <Cell label="Cuota">
        <span className="tabular-nums">{formatMonthlyAmount(m)}</span>
      </Cell>

      <div className="flex justify-start lg:justify-end">
        {isPayActionable(m) ? (
          <SettleButtons athleteId={a.athleteId} athleteName={a.fullName} membership={m} variant="row" />
        ) : !isMembershipConfigured(m) ? (
          <Link
            href={`/athletes/${a.athleteId}`}
            className="inline-flex h-8 items-center rounded-[8px] border px-3 text-[12.5px] font-bold transition-colors hover:bg-[var(--surface-2)]"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            Configurar
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/** A value with its column name shown above it on phones, where there is no header row (below lg). */
function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 lg:block">
      <span className="text-[12px] lg:hidden" style={{ color: "var(--text-3)" }}>
        {label}
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--text-3)" }}>{children}</span>;
}
