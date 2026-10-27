import Link from "next/link";
import { ArrowRight, CalendarDays, Flag, Send, Users, Wallet, type LucideIcon } from "lucide-react";
import type { Dashboard } from "@/lib/domain/dashboard";
import { DISCIPLINE_META, DISCIPLINE_ORDER } from "@/lib/domain/discipline";
import { raceSummary } from "@/lib/domain/races";
import { formatDateEs, mondayOfISO } from "@/lib/domain/time";
import { DISCIPLINE_ICON } from "@/components/workouts/discipline-icons";
import { CheckinsCard } from "@/components/checkins/CheckinsCard";

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MONTHS_TITLE = MONTHS.map((m) => m.charAt(0).toUpperCase() + m.slice(1));

const cardClass = "min-w-0 rounded-[18px] border p-5 shadow-[var(--shadow)]";
const cardStyle = { background: "var(--surface)", borderColor: "var(--border)" };

const parse = (iso: string) => new Date(iso + "T00:00:00");

/** "Lunes, 19 de octubre" */
function longDate(iso: string): string {
  const d = parse(iso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

/** "2026-10" → "Octubre 2026" */
function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return `${MONTHS_TITLE[month - 1]} ${year}`;
}

const money = (amount: number, currency: string) =>
  `${currency}${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function Kpi({ icon: Icon, value, label, note, noteTone }: {
  icon: LucideIcon;
  value: string;
  label: string;
  note?: string;
  noteTone?: "danger" | "muted";
}) {
  return (
    <div className={cardClass} style={cardStyle}>
      <div
        className="flex size-10 items-center justify-center rounded-xl"
        style={{ background: "var(--coral-tint)", color: "var(--coral)" }}
      >
        <Icon size={19} />
      </div>
      <div className="mt-3.5 text-[22px] leading-tight font-extrabold tracking-[-.6px] tabular-nums sm:text-[28px]">{value}</div>
      <div className="mt-0.5 text-[13px]" style={{ color: "var(--text-2)" }}>
        {label}
      </div>
      {note && (
        <div
          className="mt-1 text-[12px] font-semibold"
          style={{ color: noteTone === "danger" ? "var(--danger)" : "var(--text-3)" }}
        >
          {note}
        </div>
      )}
    </div>
  );
}

function CardTitle({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-3">
      <div className="text-base font-bold">{title}</div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-[13px] font-semibold"
          style={{ color: "var(--coral)" }}
        >
          {linkLabel} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-6 text-center text-[13px]" style={{ color: "var(--text-3)" }}>
      {children}
    </div>
  );
}

/** The coach's day, from the API's summary: nothing is computed here but labels. */
export function DashboardView({ data }: { data: Dashboard }) {
  const firstName = data.coachName.trim().split(/\s+/)[0];
  const todaySessions = data.upcomingSessions.filter((s) => s.date === data.today);
  const tomorrowSessions = data.upcomingSessions.filter((s) => s.date !== data.today);
  const totals = data.payments.totals.map((t) => money(t.amount, t.currency)).join(" · ");

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold tracking-[.6px] uppercase" style={{ color: "var(--text-2)" }}>
            {longDate(data.today)}
          </div>
          <h1 className="m-0 mt-1.5 text-[26px] font-extrabold tracking-[-.6px]">Hola, {firstName}</h1>
          <div className="mt-1" style={{ color: "var(--text-2)" }}>
            Hoy hay <b style={{ color: "var(--text)" }}>{plural(todaySessions.length, "sesión", "sesiones")}</b> y{" "}
            <b style={{ color: data.payments.owingCount ? "var(--pend)" : "var(--text)" }}>
              {plural(data.payments.owingCount, "cuota", "cuotas")}
            </b>{" "}
            por cobrar.
          </div>
        </div>
        <Link
          href={`/workouts?week=${data.weekStart}`}
          className="flex h-11 items-center gap-2 rounded-[10px] px-5 text-[14px] font-bold text-[var(--on-coral)] shadow-[var(--shadow)] transition-[filter] hover:brightness-110"
          style={{ background: "var(--coral)" }}
        >
          <CalendarDays size={17} /> Armar semana
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          icon={Users}
          value={`${data.athletes.withWeek}/${data.athletes.total}`}
          label="atletas con semana"
          note={data.athletes.withoutWeek.length ? `${plural(data.athletes.withoutWeek.length, "sin entrenos", "sin entrenos")}` : undefined}
        />
        <Kpi
          icon={Wallet}
          value={String(data.payments.owingCount)}
          label={data.payments.owingCount === 1 ? "cuota por cobrar" : "cuotas por cobrar"}
          note={data.payments.overdueCount ? plural(data.payments.overdueCount, "atrasada", "atrasadas") : totals || undefined}
          noteTone={data.payments.overdueCount ? "danger" : "muted"}
        />
        <Kpi
          icon={Flag}
          value={String(data.races.upcomingCount)}
          label={data.races.upcomingCount === 1 ? "carrera por venir" : "carreras por venir"}
          note={data.races.next[0] ? `La próxima en ${plural(data.races.next[0].daysLeft, "día", "días")}` : undefined}
        />
        <Kpi
          icon={Send}
          value={data.weekSentOn ? "Enviada" : "Sin enviar"}
          label="la semana"
          note={data.weekSentOn ? `el ${formatDateEs(data.weekSentOn)}` : undefined}
        />
      </div>

      {data.checkins && <CheckinsCard overview={data.checkins} className={cardClass} style={cardStyle} />}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className={cardClass} style={cardStyle}>
          <CardTitle title="Esta semana" href={`/workouts?week=${data.weekStart}`} linkLabel="Ver semana" />
          {/* Sessions per day: numbers and icons, never color alone. Scrolls sideways on a phone. */}
          <div className="-mx-1 overflow-x-auto px-1">
            <div className="grid min-w-[360px] grid-cols-7 gap-1.5">
              {data.week.map((day) => {
                const total = DISCIPLINE_ORDER.reduce((sum, d) => sum + day.sessions[d], 0);
                const isToday = day.date === data.today;
                return (
                  <div
                    key={day.date}
                    className="flex min-h-[132px] flex-col items-center gap-1.5 rounded-[12px] border px-1 py-2.5"
                    style={{
                      borderColor: isToday ? "var(--coral)" : "var(--border)",
                      background: isToday ? "var(--coral-tint)" : "var(--surface-2)",
                    }}
                  >
                    <div className="text-[11px] font-bold tracking-[.05em] uppercase" style={{ color: "var(--text-3)" }}>
                      {WEEKDAYS[parse(day.date).getDay()].slice(0, 3)} {parse(day.date).getDate()}
                    </div>
                    <div className="text-[22px] font-extrabold tabular-nums" style={{ color: total ? "var(--text)" : "var(--text-3)" }}>
                      {total}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      {DISCIPLINE_ORDER.filter((d) => day.sessions[d] > 0).map((d) => {
                        const Icon = DISCIPLINE_ICON[d];
                        return (
                          <span
                            key={d}
                            title={DISCIPLINE_META[d].label}
                            className="flex items-center gap-1 text-[12px] font-semibold tabular-nums"
                            style={{ color: "var(--text-2)" }}
                          >
                            <Icon size={13} style={{ color: DISCIPLINE_META[d].colorVar }} aria-label={DISCIPLINE_META[d].label} />
                            {day.sessions[d]}
                          </span>
                        );
                      })}
                      {total === 0 && (
                        <span className="text-[11.5px]" style={{ color: "var(--text-3)" }}>
                          Descanso
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={cardClass} style={cardStyle}>
          <CardTitle title="Carreras objetivo" />
          {data.races.next.length === 0 ? (
            <Empty>Ningún atleta tiene una carrera próxima.</Empty>
          ) : (
            <div className="flex flex-col gap-2.5">
              {data.races.next.map((race) => (
                <div
                  key={race.id}
                  className="flex items-center gap-3 rounded-[14px] border p-3"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-bold">{race.name}</div>
                    <div className="truncate text-[12px]" style={{ color: "var(--text-2)" }}>
                      {raceSummary(race)} · {formatDateEs(race.date)}
                    </div>
                    <div className="truncate text-[12px]" style={{ color: "var(--text-3)" }}>
                      {race.athletes.map((a) => a.fullName).join(", ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[17px] font-extrabold tabular-nums" style={{ color: "var(--coral)" }}>
                      {race.daysLeft === 0 ? "Hoy" : race.daysLeft}
                    </div>
                    {race.daysLeft > 0 && (
                      <div className="text-[10.5px]" style={{ color: "var(--text-3)" }}>
                        {race.daysLeft === 1 ? "día" : "días"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className={cardClass} style={cardStyle}>
          <CardTitle title="Hoy y mañana" href={`/workouts?week=${data.weekStart}`} linkLabel="Ver entrenos" />
          {data.upcomingSessions.length === 0 ? (
            <Empty>No hay entrenos hoy ni mañana.</Empty>
          ) : (
            <div className="flex flex-col">
              {[
                { label: "Hoy", sessions: todaySessions },
                { label: "Mañana", sessions: tomorrowSessions },
              ]
                .filter((group) => group.sessions.length > 0)
                .map((group) => (
                  <div key={group.label} className="flex flex-col">
                    <div
                      className="pt-2 pb-1 text-[11px] font-bold tracking-[.06em] uppercase"
                      style={{ color: "var(--text-3)" }}
                    >
                      {group.label}
                    </div>
                    {group.sessions.map((s) => {
                      const Icon = DISCIPLINE_ICON[s.discipline];
                      const meta = DISCIPLINE_META[s.discipline];
                      return (
                        <Link
                          key={`${s.date}-${s.athleteId}-${s.sessionId}`}
                          href={`/workouts/athletes/${s.athleteId}/sessions/${s.sessionId}?week=${mondayOfISO(s.date)}`}
                          className="flex items-center gap-3 rounded-[10px] px-2 py-2.5 transition-colors hover:bg-[var(--surface-2)]"
                          style={{ color: "var(--text)" }}
                        >
                          <span
                            className="flex size-8 flex-none items-center justify-center rounded-[9px]"
                            style={{ background: meta.tintVar, color: meta.colorVar }}
                          >
                            <Icon size={15} aria-label={meta.label} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] font-semibold">{s.athleteName}</span>
                            <span className="block truncate text-[12px]" style={{ color: "var(--text-2)" }}>
                              {s.sessionName}
                            </span>
                          </span>
                          <ArrowRight size={14} style={{ color: "var(--text-3)" }} />
                        </Link>
                      );
                    })}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className={cardClass} style={cardStyle}>
            <CardTitle title="Por cobrar" href="/payments" linkLabel="Ver pagos" />
            {data.payments.owing.length === 0 ? (
              <Empty>Nadie debe su cuota.</Empty>
            ) : (
              <div className="flex flex-col">
                {data.payments.owing.map((o) => (
                  <Link
                    key={o.athleteId}
                    href={`/athletes/${o.athleteId}`}
                    className="flex items-center justify-between gap-3 rounded-[10px] px-2 py-2.5 transition-colors hover:bg-[var(--surface-2)]"
                    style={{ color: "var(--text)" }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-semibold">{o.fullName}</span>
                      <span
                        className="block text-[12px]"
                        style={{ color: o.status === "overdue" ? "var(--danger)" : "var(--text-2)" }}
                      >
                        {o.status === "overdue" ? "Atrasada desde " : "Pendiente · "}
                        {periodLabel(o.period)}
                        {o.periodsOwed > 1 && ` · ${o.periodsOwed} meses`}
                      </span>
                    </span>
                    <span className="text-[14px] font-bold tabular-nums">{money(o.amountOwed, o.currency)}</span>
                  </Link>
                ))}
              </div>
            )}
            {data.payments.unconfiguredCount > 0 && (
              <div className="mt-2 text-[12px]" style={{ color: "var(--text-3)" }}>
                {plural(data.payments.unconfiguredCount, "atleta", "atletas")} sin cuota configurada.
              </div>
            )}
          </div>

          {data.athletes.withoutWeek.length > 0 && (
            <div className={cardClass} style={cardStyle}>
              <CardTitle title="Sin entrenos esta semana" />
              <div className="flex flex-col">
                {data.athletes.withoutWeek.map((a) => (
                  <Link
                    key={a.id}
                    href={`/workouts/athletes/${a.id}?week=${data.weekStart}`}
                    className="flex items-center justify-between gap-3 rounded-[10px] px-2 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-[var(--surface-2)]"
                    style={{ color: "var(--text)" }}
                  >
                    {a.fullName}
                    <ArrowRight size={14} style={{ color: "var(--text-3)" }} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
