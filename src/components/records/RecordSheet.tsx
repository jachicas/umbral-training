"use client";

import { useState, useTransition, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { AthleteAvatar } from "@/components/athletes/AthleteAvatar";
import { BLANK_DURATION, DurationInput, joinDuration, type DurationParts } from "@/components/athletes/fields/DurationInput";
import { saveRecordSheetAction } from "@/app/records/actions";
import {
  RACE_REFERENCES,
  REFERENCE_DISTANCE_KM,
  formatDateEs,
  formatDuration,
  formatPacePerKm,
  parseDuration,
} from "@/lib/domain/time";
import type { RaceReference } from "@/lib/domain/types";
import { CoverageBar } from "./RecordsOverview";
import { bestOver, type RecordAthleteVM } from "./types";

type Filter = "all" | "missing" | "have";

interface Entry {
  time: DurationParts;
  recordedOn: string;
  note: string;
}

/** Entries are kept per distance and athlete, so switching distances keeps what was typed. */
type EntryKey = `${RaceReference}:${string}`;
const keyOf = (reference: RaceReference, athleteId: string): EntryKey => `${reference}:${athleteId}`;
const referenceOf = (key: string) => key.split(":")[0] as RaceReference;

const GRID_COLS = "minmax(180px,1.3fr) minmax(140px,1fr) 236px 160px minmax(120px,1fr) 84px";

/** Local calendar date — `toISOString()` would shift the day near midnight. */
function todayLocalISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Lowercase and without accents, so "umana" finds "Umaña". */
const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/**
 * /records/[distance]: every athlete's current time over a distance, with
 * boxes to type a new one. Times typed over several distances go out together
 * with "Guardar marcas", all or none.
 */
export function RecordSheet({
  athletes,
  initialReference,
}: {
  athletes: RecordAthleteVM[];
  initialReference: RaceReference;
}) {
  const [reference, setReference] = useState(initialReference);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<Partial<Record<EntryKey, Entry>>>({});
  const [errors, setErrors] = useState<Partial<Record<EntryKey, string>>>({});
  const [result, setResult] = useState<{ savedCount?: number; error?: string } | null>(null);
  const [saving, startSaving] = useTransition();

  // A row counts once its boxes hold a time.
  const typed = (Object.entries(entries) as [EntryKey, Entry][]).filter(([, e]) => joinDuration(e.time) !== "");
  const typedOver = (r: RaceReference) => typed.filter(([key]) => referenceOf(key) === r).length;

  const total = athletes.length;
  const have = athletes.filter((a) => a.latest[reference]).length;
  const best = bestOver(athletes, reference);

  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const rows = athletes.filter((a) => {
    if (filter === "missing" && a.latest[reference]) return false;
    if (filter === "have" && !a.latest[reference]) return false;
    return terms.every((t) => normalize(a.fullName).includes(t));
  });

  function pick(next: RaceReference) {
    setReference(next);
    window.history.replaceState(null, "", `/records/${next}`);
  }

  function update(athleteId: string, patch: Partial<Entry>) {
    const key = keyOf(reference, athleteId);
    const blank: Entry = { time: BLANK_DURATION, recordedOn: todayLocalISO(), note: "" };
    setEntries((all) => ({ ...all, [key]: { ...(all[key] ?? blank), ...patch } }));
    setErrors((all) => {
      const rest = { ...all };
      delete rest[key];
      return rest;
    });
    setResult(null);
  }

  function save() {
    const sent = typed.map(([key, e]) => ({
      key,
      entry: {
        athleteId: key.slice(key.indexOf(":") + 1),
        reference: referenceOf(key),
        time: joinDuration(e.time),
        recordedOn: e.recordedOn,
        note: e.note,
      },
    }));
    startSaving(async () => {
      const res = await saveRecordSheetAction(sent.map((s) => s.entry));
      if (res.errors) {
        setErrors(Object.fromEntries(Object.entries(res.errors).map(([i, message]) => [sent[Number(i)].key, message])));
        return;
      }
      if (res.error) {
        setResult({ error: res.error });
        return;
      }
      setEntries({});
      setErrors({});
      setResult({ savedCount: res.savedCount });
    });
  }

  const pendingByReference = RACE_REFERENCES.map((r) => ({ reference: r, count: typedOver(r) })).filter((p) => p.count > 0);
  const errorCount = Object.keys(errors).length;

  return (
    <div className="flex flex-col gap-[18px]">
      <h1 className="m-0 text-[24px] font-bold tracking-[-.4px]">Marcas · {reference.toUpperCase()}</h1>

      <div role="group" aria-label="Distancia" className="glass flex flex-wrap gap-1 self-start rounded-[16px] p-[5px]">
        {RACE_REFERENCES.map((r) => {
          const active = r === reference;
          const withErrors = (Object.keys(errors) as EntryKey[]).some((key) => referenceOf(key) === r);
          return (
            <button
              key={r}
              type="button"
              aria-pressed={active}
              onClick={() => pick(r)}
              className={cn(
                "flex min-h-11 items-center gap-2.5 rounded-[12px] px-[18px] transition-colors",
                active ? "bg-[var(--glass-strong)] shadow-[var(--shadow)]" : "hover:bg-[var(--surface-2)]"
              )}
            >
              <span className="text-[15px] font-extrabold">{r.toUpperCase()}</span>
              <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: "var(--text-2)" }}>
                {athletes.filter((a) => a.latest[r]).length}/{total}
              </span>
              {(withErrors || typedOver(r) > 0) && (
                <span
                  aria-hidden
                  className="size-[7px] rounded-full"
                  style={{ background: withErrors ? "var(--danger)" : "var(--coral)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Stat label="Con marca">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[24px] font-extrabold tabular-nums">{have}</span>
            <span className="text-[14px]" style={{ color: "var(--text-2)" }}>
              / {total}
            </span>
          </div>
          <div className="mt-2.5">
            <CoverageBar have={have} total={total} />
          </div>
        </Stat>
        <Stat label="Sin marca">
          <span className="text-[24px] font-extrabold tabular-nums" style={{ color: "var(--pend)" }}>
            {total - have}
          </span>
        </Stat>
        <Stat label="Mejor">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="text-[24px] font-extrabold tabular-nums">
              {best ? formatDuration(best.mark.timeSeconds) : "—"}
            </span>
            {best && (
              <span className="truncate text-[13px]" style={{ color: "var(--text-2)" }}>
                {best.athlete.fullName}
              </span>
            )}
          </div>
        </Stat>
      </div>

      <section
        aria-label="Atletas"
        className="min-w-0 rounded-[18px] border shadow-[var(--shadow)]"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
          <div role="group" aria-label="Filtro" className="flex flex-wrap gap-2">
            {(
              [
                { value: "all", label: "Todos", count: total },
                { value: "missing", label: "Sin marca", count: total - have },
                { value: "have", label: "Con marca", count: have },
              ] as const
            ).map((f) => {
              const active = f.value === filter;
              return (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
                    active ? "border-transparent" : "hover:bg-[var(--surface-2)]"
                  )}
                  style={
                    active
                      ? { background: "var(--text)", color: "var(--bg)" }
                      : { borderColor: "var(--border-2)", color: "var(--text)" }
                  }
                >
                  {f.label}
                  <span className="tabular-nums opacity-75">{f.count}</span>
                </button>
              );
            })}
          </div>
          <label
            className="flex h-9 w-full items-center gap-2 rounded-full border px-3.5 focus-within:border-[var(--coral)] sm:w-60"
            style={{ borderColor: "var(--border-2)" }}
          >
            <Search size={15} aria-hidden style={{ color: "var(--text-2)" }} />
            <input
              type="search"
              aria-label="Buscar atleta"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <div
              className="grid gap-4 border-t px-5 py-2.5 text-[11.5px] font-semibold tracking-[.03em] uppercase"
              style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-3)" }}
            >
              <span>Atleta</span>
              <span>Marca actual</span>
              <span>Nueva marca</span>
              <span>Fecha</span>
              <span>Nota</span>
              <span className="text-right">Cambio</span>
            </div>

            {rows.map((a) => {
              const key = keyOf(reference, a.id);
              const entry = entries[key];
              const current = a.latest[reference];
              const isTyped = !!entry && joinDuration(entry.time) !== "";
              const error = errors[key];
              return (
                <div
                  key={a.id}
                  className="border-t px-5 py-2.5 text-[13.5px] transition-colors"
                  style={{
                    borderColor: "var(--border)",
                    background: isTyped ? "color-mix(in srgb, var(--coral) 8%, transparent)" : undefined,
                  }}
                >
                  <div className="grid items-center gap-4" style={{ gridTemplateColumns: GRID_COLS }}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <AthleteAvatar fullName={a.fullName} color={a.avatarColor} size={32} radius={999} className="text-[12px]" />
                      <span className="truncate font-semibold">{a.fullName}</span>
                    </div>

                    <div className="min-w-0">
                      {current ? (
                        <>
                          <div className="text-[14.5px] font-bold tabular-nums">{formatDuration(current.timeSeconds)}</div>
                          <div className="truncate text-[12px] tabular-nums" style={{ color: "var(--text-2)" }}>
                            {formatPacePerKm(current.timeSeconds / REFERENCE_DISTANCE_KM[reference])} ·{" "}
                            {formatDateEs(current.recordedOn)}
                          </div>
                        </>
                      ) : (
                        <span
                          className="inline-flex rounded-full px-2.5 py-[3px] text-[12px] font-bold"
                          style={{ background: "color-mix(in srgb, var(--pend) 16%, transparent)", color: "var(--pend)" }}
                        >
                          Sin marca
                        </span>
                      )}
                    </div>

                    <DurationInput
                      of={a.fullName}
                      value={entry?.time ?? BLANK_DURATION}
                      onChange={(time) => update(a.id, { time })}
                      invalid={!!error}
                    />

                    {isTyped ? (
                      <Input
                        type="date"
                        aria-label={`Fecha, ${a.fullName}`}
                        value={entry.recordedOn}
                        onChange={(e) => update(a.id, { recordedOn: e.target.value })}
                      />
                    ) : (
                      <span />
                    )}
                    {isTyped ? (
                      <Input
                        aria-label={`Nota, ${a.fullName}`}
                        value={entry.note}
                        onChange={(e) => update(a.id, { note: e.target.value })}
                      />
                    ) : (
                      <span />
                    )}

                    <div className="flex justify-end">
                      {isTyped && <Change current={current?.timeSeconds} typed={parseDuration(joinDuration(entry.time))} />}
                    </div>
                  </div>
                  {error && (
                    <p role="alert" className="m-0 mt-1.5 text-[12.5px] font-semibold" style={{ color: "var(--danger)" }}>
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {(typed.length > 0 || result) && (
        <div className="glass-strong sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-[18px] py-2.5 pr-2.5 pl-5">
          {typed.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[14px] font-bold">
                  {typed.length === 1 ? "1 marca por guardar" : `${typed.length} marcas por guardar`}
                </span>
                {pendingByReference.map((p) => (
                  <span
                    key={p.reference}
                    className="rounded-full px-2.5 py-[3px] text-[12px] font-bold tabular-nums"
                    style={{ background: "var(--surface-3)" }}
                  >
                    {p.reference.toUpperCase()} · {p.count}
                  </span>
                ))}
                {errorCount > 0 && (
                  <span className="text-[13px] font-semibold" style={{ color: "var(--danger)" }}>
                    {errorCount === 1 ? "1 por revisar" : `${errorCount} por revisar`}
                  </span>
                )}
                {result?.error && (
                  <span className="text-[13px] font-semibold" style={{ color: "var(--danger)" }}>
                    {result.error}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setEntries({});
                    setErrors({});
                    setResult(null);
                  }}
                  className="h-11 rounded-[12px] border px-[18px] text-[14px] font-semibold transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
                  style={{ borderColor: "var(--border-2)" }}
                >
                  Descartar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={save}
                  className="h-11 rounded-[12px] px-5 text-[14px] font-bold transition-[filter] hover:brightness-110 disabled:opacity-60"
                  style={{ background: "var(--coral)", color: "var(--on-coral)" }}
                >
                  {saving ? "Guardando…" : "Guardar marcas"}
                </button>
              </div>
            </>
          ) : result?.savedCount ? (
            <div role="status" className="flex min-h-11 items-center gap-2 text-[14px] font-bold" style={{ color: "var(--ok)" }}>
              <Check size={18} aria-hidden />
              {result.savedCount === 1 ? "1 marca guardada" : `${result.savedCount} marcas guardadas`}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      className="min-w-0 rounded-[18px] border px-[18px] py-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="mb-1.5 text-[11.5px] font-semibold tracking-[.06em] uppercase" style={{ color: "var(--text-3)" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

/** How the typed time compares with the current one; "Nueva" when there was none. */
function Change({ current, typed }: { current?: number; typed: number | null }) {
  if (typed === null) {
    return (
      <span className="text-[12.5px] font-bold" style={{ color: "var(--danger)" }}>
        Revisar
      </span>
    );
  }
  if (current === undefined) {
    return (
      <span
        className="rounded-full px-2.5 py-[3px] text-[12px] font-bold"
        style={{ background: "var(--coral-tint-2)", color: "var(--coral)" }}
      >
        Nueva
      </span>
    );
  }
  const diff = typed - current;
  if (diff === 0) return null;
  const Arrow = diff < 0 ? ArrowDown : ArrowUp;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[13px] font-bold tabular-nums"
      style={{ color: diff < 0 ? "var(--ok)" : "var(--text-2)" }}
    >
      <Arrow size={14} strokeWidth={2.4} aria-hidden />
      {formatDuration(Math.abs(diff))}
    </span>
  );
}
