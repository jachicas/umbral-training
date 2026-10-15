"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Plus, Repeat, Trash2 } from "lucide-react";
import type { Discipline, RaceReference } from "@/lib/domain/types";
import type {
  LibrarySessionInput,
  WorkoutNodeInput,
  WorkoutSession,
  WorkoutStep,
  WorkoutStepInput,
  WorkoutStepKind,
} from "@/lib/domain/workouts";
import { DISCIPLINE_META, DISCIPLINE_ORDER } from "@/lib/domain/discipline";
import { RACE_REFERENCES, formatDuration, parseDuration } from "@/lib/domain/time";
import {
  deleteLibrarySessionAction,
  saveLibrarySessionAction,
  type AddToWeek,
} from "@/app/workouts/library/actions";
import { sessionSummary } from "./format";

/*
 * Editor for a library session: an ordered list of steps and repeats (a
 * repeat holds steps, never another repeat), in the API's shape. Fields are
 * kept as typed text here and parsed on save; the API checks the rest and
 * answers with messages keyed by path ("nodes.1.steps.0.duration.meters"),
 * shown next to the step they belong to.
 */

const STEP_KIND_LABEL: Record<WorkoutStepKind, string> = {
  warmup: "Calentamiento",
  work: "Trabajo",
  recovery: "Recuperación",
  cooldown: "Enfriamiento",
};
const STEP_KINDS = Object.keys(STEP_KIND_LABEL) as WorkoutStepKind[];

interface StepDraft {
  key: number;
  type: "step";
  kind: WorkoutStepKind;
  durationKind: "time" | "distance";
  /** "m:ss" / "h:mm:ss" for time (a bare number means minutes); meters for distance. */
  durationText: string;
  targetKind: "relative" | "feel";
  reference: RaceReference;
  percentText: string;
  label: string;
}

interface RepeatDraft {
  key: number;
  type: "repeat";
  timesText: string;
  steps: StepDraft[];
}

type NodeDraft = StepDraft | RepeatDraft;

let nextKey = 1;
const newKey = () => nextKey++;

function stepDraft(step?: WorkoutStep): StepDraft {
  return {
    key: newKey(),
    type: "step",
    kind: step?.kind ?? "work",
    durationKind: step?.duration.kind ?? "time",
    durationText: !step
      ? "30"
      : step.duration.kind === "time"
        ? // Whole minutes read as minutes ("15"); anything else as m:ss ("1:30").
          step.duration.seconds % 60 === 0
          ? String(step.duration.seconds / 60)
          : formatDuration(step.duration.seconds)
        : String(step.duration.meters),
    targetKind: step?.target.kind ?? "feel",
    reference: step?.target.kind === "relative" ? step.target.reference : "5k",
    percentText: step?.target.kind === "relative" ? String(step.target.percent) : "85",
    label: step?.target.kind === "feel" ? step.target.label : "Suave",
  };
}

function draftsFrom(session: WorkoutSession | null): NodeDraft[] {
  if (!session) return [stepDraft()];
  return session.nodes.map((node) =>
    node.type === "repeat"
      ? { key: newKey(), type: "repeat", timesText: String(node.times), steps: node.steps.map(stepDraft) }
      : stepDraft(node)
  );
}

/** Text that isn't a number is sent as-is so the API names the problem. */
function toNumber(text: string): number {
  const n = Number(text.trim().replace(",", "."));
  return Number.isFinite(n) && text.trim() !== "" ? n : (text as unknown as number);
}

/** The draft as the API expects it, plus format errors only the web can catch (an unreadable time). */
function toInput(
  name: string,
  discipline: Discipline,
  drafts: NodeDraft[]
): { input: LibrarySessionInput; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const step = (draft: StepDraft, path: string): WorkoutStepInput => {
    let duration: WorkoutStepInput["duration"];
    if (draft.durationKind === "time") {
      const text = draft.durationText.trim();
      const seconds = /^\d+$/.test(text) ? Number(text) * 60 : parseDuration(text);
      if (seconds === null) errors[`${path}.duration.seconds`] = "Usa minutos (30) o m:ss (4:30).";
      duration = { kind: "time", seconds: seconds ?? 0 };
    } else {
      duration = { kind: "distance", meters: toNumber(draft.durationText) };
    }

    const target: WorkoutStepInput["target"] =
      draft.targetKind === "relative"
        ? { kind: "relative", reference: draft.reference, percent: toNumber(draft.percentText) }
        : { kind: "feel", label: draft.label };

    return { type: "step", kind: draft.kind, duration, target };
  };

  const nodes: WorkoutNodeInput[] = drafts.map((draft, i) =>
    draft.type === "repeat"
      ? {
          type: "repeat",
          times: toNumber(draft.timesText),
          steps: draft.steps.map((s, j) => step(s, `nodes.${i}.steps.${j}`)),
        }
      : step(draft, `nodes.${i}`)
  );

  return { input: { name: name.trim(), discipline, nodes }, errors };
}

/**
 * Messages at `path` or inside it. With `ownOnly` (a repeat's header), the
 * ones inside its steps are left for the step rows.
 */
function errorsAt(errors: Record<string, string>, path: string, ownOnly = false): string[] {
  return Object.entries(errors)
    .filter(([key]) => key === path || key.startsWith(`${path}.`))
    .filter(([key]) => !ownOnly || !key.startsWith(`${path}.steps.`))
    .map(([, message]) => message);
}

function move<T>(list: T[], index: number, by: -1 | 1): T[] {
  const target = index + by;
  if (target < 0 || target >= list.length) return list;
  const copy = [...list];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

/* ------------------------------------------------------------------ */

const field = "h-9 rounded-[9px] border px-2.5 text-[13px] font-semibold outline-none";
const fieldStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

function Toggle<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-[9px] border p-0.5" style={{ borderColor: "var(--border)" }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={o.id === value}
          onClick={() => onChange(o.id)}
          className="rounded-[7px] px-2.5 py-1 text-[12px] font-bold"
          style={o.id === value ? { background: "var(--coral)", color: "#fff" } : { color: "var(--text-2)" }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function IconButton({ label, onClick, children, disabled }: { label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 flex-none items-center justify-center rounded-[8px] transition-[filter] hover:brightness-125 disabled:opacity-30"
      style={{ color: "var(--text-3)" }}
    >
      {children}
    </button>
  );
}

function Errors({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      {messages.map((m) => (
        <span key={m} className="text-[11.5px] font-semibold" style={{ color: "var(--danger)" }}>
          {m}
        </span>
      ))}
    </div>
  );
}

function StepRow({
  step,
  onChange,
  controls,
  errors,
}: {
  step: StepDraft;
  onChange: (step: StepDraft) => void;
  controls: React.ReactNode;
  errors: string[];
}) {
  const set = (patch: Partial<StepDraft>) => onChange({ ...step, ...patch });

  return (
    <div className="flex flex-col gap-1.5 rounded-[12px] border px-3 py-2.5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Tipo de paso"
          value={step.kind}
          onChange={(e) => set({ kind: e.target.value as WorkoutStepKind })}
          className={field}
          style={fieldStyle}
        >
          {STEP_KINDS.map((k) => (
            <option key={k} value={k}>
              {STEP_KIND_LABEL[k]}
            </option>
          ))}
        </select>

        <Toggle
          label="Duración"
          value={step.durationKind}
          onChange={(durationKind) => set({ durationKind, durationText: durationKind === "time" ? "10" : "400" })}
          options={[
            { id: "time", label: "Tiempo" },
            { id: "distance", label: "Distancia" },
          ]}
        />
        <label className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-2)" }}>
          <input
            aria-label={step.durationKind === "time" ? "Tiempo" : "Distancia en metros"}
            value={step.durationText}
            onChange={(e) => set({ durationText: e.target.value })}
            inputMode={step.durationKind === "time" ? "text" : "numeric"}
            className={`${field} w-[76px] text-right`}
            style={fieldStyle}
          />
          {step.durationKind === "time" ? "min" : "m"}
        </label>

        <Toggle
          label="Intensidad"
          value={step.targetKind}
          onChange={(targetKind) => set({ targetKind })}
          options={[
            { id: "relative", label: "Ritmo" },
            { id: "feel", label: "Sensación" },
          ]}
        />
        {step.targetKind === "relative" ? (
          <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-2)" }}>
            <input
              aria-label="Porcentaje"
              value={step.percentText}
              onChange={(e) => set({ percentText: e.target.value })}
              inputMode="decimal"
              className={`${field} w-[60px] text-right`}
              style={fieldStyle}
            />
            % del
            <select
              aria-label="Distancia de referencia"
              value={step.reference}
              onChange={(e) => set({ reference: e.target.value as RaceReference })}
              className={field}
              style={fieldStyle}
            >
              {RACE_REFERENCES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </span>
        ) : (
          <input
            aria-label="Sensación"
            placeholder="Suave, RPE 7…"
            value={step.label}
            maxLength={60}
            onChange={(e) => set({ label: e.target.value })}
            className={`${field} w-[150px]`}
            style={fieldStyle}
          />
        )}

        <div className="ml-auto flex items-center">{controls}</div>
      </div>
      <Errors messages={errors} />
    </div>
  );
}

export function SessionEditor({
  session,
  addTo,
  cancelHref,
}: {
  /** null when creating. */
  session: WorkoutSession | null;
  addTo: AddToWeek | null;
  cancelHref: string;
}) {
  const [name, setName] = useState(session?.name ?? "");
  const [discipline, setDiscipline] = useState<Discipline>(session?.discipline ?? "run");
  const [nodes, setNodes] = useState<NodeDraft[]>(() => draftsFrom(session));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const topRef = useRef<HTMLDivElement>(null);

  const updateNode = (index: number, node: NodeDraft) => setNodes((all) => all.map((n, i) => (i === index ? node : n)));
  const removeNode = (index: number) => setNodes((all) => all.filter((_, i) => i !== index));

  function save() {
    const { input, errors: local } = toInput(name, discipline, nodes);
    if (Object.keys(local).length > 0) {
      setErrors(local);
      setFormError("Revisa los campos marcados.");
      return;
    }
    startTransition(async () => {
      const result = await saveLibrarySessionAction(session?.id ?? null, input, addTo);
      setErrors(result.fieldErrors ?? {});
      setFormError(result.error);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function remove() {
    if (!session || !window.confirm(`¿Borrar «${session.name}» de tu biblioteca? Las semanas que ya la tienen no cambian.`)) return;
    startTransition(async () => setFormError((await deleteLibrarySessionAction(session.id)).error));
  }

  // A live summary, from whatever parses so far.
  const preview = toInput(name, discipline, nodes);
  const previewSession: WorkoutSession = {
    id: "preview",
    name,
    discipline,
    nodes: preview.input.nodes.map((n, i) =>
      n.type === "repeat"
        ? { ...n, id: `r${i}`, steps: n.steps.map((s, j) => ({ ...s, id: `r${i}s${j}` })) }
        : { ...n, id: `s${i}` }
    ),
  };

  return (
    <div ref={topRef} className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            aria-label="Nombre de la sesión"
            placeholder="Nombre de la sesión (p. ej. Series 400)"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            className="w-full max-w-[520px] border-b-2 bg-transparent pb-1 text-[24px] font-extrabold tracking-[-.4px] outline-none"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          />
          <Errors messages={errors.name ? [errors.name] : []} />
          <div className="text-[12.5px]" style={{ color: "var(--text-2)" }}>
            {sessionSummary(previewSession) || "Sin pasos"}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {session && (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="flex h-[42px] items-center gap-1.5 rounded-[10px] px-4 text-[13px] font-bold disabled:opacity-60"
              style={{ color: "var(--danger)" }}
            >
              <Trash2 size={15} /> Borrar
            </button>
          )}
          <Link
            href={cancelHref}
            className="flex h-[42px] items-center rounded-[10px] border px-4 text-[13.5px] font-bold"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
          >
            Cancelar
          </Link>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="flex h-[42px] items-center rounded-[10px] px-5 text-[13.5px] font-bold text-white shadow-[var(--shadow)] transition-[filter] hover:brightness-110 disabled:opacity-60"
            style={{ background: "var(--coral)" }}
          >
            {pending ? "Guardando…" : addTo ? "Guardar y agregar al día" : "Guardar sesión"}
          </button>
        </div>
      </div>

      {formError && (
        <div className="rounded-[12px] border px-4 py-2.5 text-[13px] font-semibold" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
          {formError}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {DISCIPLINE_ORDER.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={d === discipline}
            onClick={() => setDiscipline(d)}
            className="rounded-[10px] border px-3.5 py-2 text-[13px] font-bold"
            style={
              d === discipline
                ? { background: DISCIPLINE_META[d].colorVar, borderColor: "transparent", color: "#fff" }
                : { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-2)" }
            }
          >
            {DISCIPLINE_META[d].label}
          </button>
        ))}
      </div>
      <Errors messages={errors.discipline ? [errors.discipline] : []} />

      <div className="flex flex-col gap-2.5">
        <Errors messages={errors.nodes ? [errors.nodes] : []} />
        {nodes.map((node, i) => {
          const path = `nodes.${i}`;
          const controls = (
            <>
              <IconButton label="Subir" disabled={i === 0} onClick={() => setNodes((all) => move(all, i, -1))}>
                <ArrowUp size={15} />
              </IconButton>
              <IconButton label="Bajar" disabled={i === nodes.length - 1} onClick={() => setNodes((all) => move(all, i, 1))}>
                <ArrowDown size={15} />
              </IconButton>
              <IconButton label="Quitar" onClick={() => removeNode(i)}>
                <Trash2 size={15} />
              </IconButton>
            </>
          );

          if (node.type === "step") {
            return (
              <StepRow
                key={node.key}
                step={node}
                onChange={(step) => updateNode(i, step)}
                controls={controls}
                errors={errorsAt(errors, path)}
              />
            );
          }

          return (
            <div
              key={node.key}
              className="flex flex-col gap-2 rounded-[14px] border p-3"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", borderLeft: "4px solid var(--coral)" }}
            >
              <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
                <Repeat size={15} style={{ color: "var(--coral)" }} />
                Serie · repetir
                <input
                  aria-label="Repeticiones"
                  value={node.timesText}
                  onChange={(e) => updateNode(i, { ...node, timesText: e.target.value })}
                  inputMode="numeric"
                  className={`${field} w-[56px] text-right`}
                  style={fieldStyle}
                />
                veces
                <div className="ml-auto flex items-center">{controls}</div>
              </div>
              <Errors messages={errorsAt(errors, path, true)} />
              <div className="flex flex-col gap-2 pl-3">
                {node.steps.map((step, j) => (
                  <StepRow
                    key={step.key}
                    step={step}
                    onChange={(s) => updateNode(i, { ...node, steps: node.steps.map((x, k) => (k === j ? s : x)) })}
                    errors={errorsAt(errors, `${path}.steps.${j}`)}
                    controls={
                      <>
                        <IconButton label="Subir" disabled={j === 0} onClick={() => updateNode(i, { ...node, steps: move(node.steps, j, -1) })}>
                          <ArrowUp size={15} />
                        </IconButton>
                        <IconButton
                          label="Bajar"
                          disabled={j === node.steps.length - 1}
                          onClick={() => updateNode(i, { ...node, steps: move(node.steps, j, 1) })}
                        >
                          <ArrowDown size={15} />
                        </IconButton>
                        <IconButton label="Quitar" onClick={() => updateNode(i, { ...node, steps: node.steps.filter((_, k) => k !== j) })}>
                          <Trash2 size={15} />
                        </IconButton>
                      </>
                    }
                  />
                ))}
                <button
                  type="button"
                  onClick={() => updateNode(i, { ...node, steps: [...node.steps, stepDraft()] })}
                  className="flex w-fit items-center gap-1.5 text-[12.5px] font-semibold"
                  style={{ color: "var(--coral)" }}
                >
                  <Plus size={13} /> Paso en la serie
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => setNodes((all) => [...all, stepDraft()])}
          className="flex h-[40px] items-center gap-1.5 rounded-[10px] border px-4 text-[13px] font-bold"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
        >
          <Plus size={15} /> Paso
        </button>
        <button
          type="button"
          onClick={() =>
            setNodes((all) => [
              ...all,
              {
                key: newKey(),
                type: "repeat",
                timesText: "6",
                steps: [
                  { ...stepDraft(), durationKind: "distance", durationText: "400", targetKind: "relative" },
                  { ...stepDraft(), kind: "recovery", durationText: "1:00", label: "Trote" },
                ],
              },
            ])
          }
          className="flex h-[40px] items-center gap-1.5 rounded-[10px] border px-4 text-[13px] font-bold"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
        >
          <Repeat size={15} /> Serie
        </button>
      </div>
    </div>
  );
}
