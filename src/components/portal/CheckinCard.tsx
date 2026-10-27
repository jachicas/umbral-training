"use client";

import { useActionState, useState } from "react";
import { CalendarCheck, Pencil, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/athletes/fields/FieldError";
import { PortalCard, PortalLabel } from "@/components/portal/PortalShell";
import { saveCheckinAction, type CheckinState } from "@/app/portal/actions";
import {
  COMPLETION_LABEL,
  FEELINGS,
  effortLabel,
  feelingMeta,
  type CheckinCompletion,
  type PortalCheckin,
} from "@/lib/domain/checkins";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "miércoles 21 oct". */
function weekdayDate(dateISO: string): string {
  const d = new Date(dateISO + "T00:00:00");
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/**
 * The end-of-week check-in, under the week's days. Before Sunday it only says
 * when it opens; while open it's a short form (and its answer can be changed);
 * once closed it shows what they answered, if they did.
 */
export function CheckinCard({
  weekStart,
  checkin,
  coachFirstName,
}: {
  weekStart: string;
  checkin: PortalCheckin;
  coachFirstName: string;
}) {
  const { status, answer } = checkin;
  const [editing, setEditing] = useState(false);

  if (status === "upcoming") {
    return (
      <PortalCard className="flex items-center gap-3 !py-3.5">
        <CalendarCheck size={18} className="flex-none" style={{ color: "var(--text-3)" }} />
        <p className="m-0 text-[13px]" style={{ color: "var(--text-2)" }}>
          Check-in el {weekdayDate(checkin.opensOn)}
        </p>
      </PortalCard>
    );
  }

  if (status === "closed" && !answer) {
    return (
      <PortalCard className="flex items-center gap-3 !py-3.5 opacity-70">
        <CalendarCheck size={18} className="flex-none" style={{ color: "var(--text-3)" }} />
        <p className="m-0 text-[13px]" style={{ color: "var(--text-2)" }}>
          Sin check-in esta semana
        </p>
      </PortalCard>
    );
  }

  if (answer && !editing) {
    const feeling = feelingMeta(answer.feeling);
    return (
      <PortalCard className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="text-[34px] leading-none" aria-hidden>
            {feeling.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <PortalLabel>Tu check-in</PortalLabel>
            <div className="mt-0.5 text-[17px] font-bold">Te sentiste {feeling.label.toLowerCase()}</div>
          </div>
          {status === "open" && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="glass inline-flex flex-none items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-[var(--text)] transition-[filter] hover:brightness-110"
            >
              <Pencil size={13} /> Editar
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip>
            Esfuerzo {answer.effort}/10 · {effortLabel(answer.effort)}
          </Chip>
          <Chip>Entrenos: {COMPLETION_LABEL[answer.completion].toLowerCase()}</Chip>
          <Chip danger={answer.pain}>{answer.pain ? `Molestia: ${answer.painNote}` : "Sin molestias"}</Chip>
        </div>
        {answer.comment && (
          <p className="m-0 text-[13.5px] italic" style={{ color: "var(--text-2)" }}>
            “{answer.comment}”
          </p>
        )}
      </PortalCard>
    );
  }

  return (
    <CheckinForm
      weekStart={weekStart}
      checkin={checkin}
      coachFirstName={coachFirstName}
      onDone={() => setEditing(false)}
      onCancel={answer ? () => setEditing(false) : undefined}
    />
  );
}

function CheckinForm({
  weekStart,
  checkin,
  coachFirstName,
  onDone,
  onCancel,
}: {
  weekStart: string;
  checkin: PortalCheckin;
  coachFirstName: string;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const answer = checkin.answer;
  const [feeling, setFeeling] = useState(answer?.feeling ?? 0);
  const [effort, setEffort] = useState(answer?.effort ?? 0);
  const [completion, setCompletion] = useState<CheckinCompletion | "">(answer?.completion ?? "");
  const [pain, setPain] = useState<"yes" | "no" | "">(answer ? (answer.pain ? "yes" : "no") : "");
  const [state, formAction, pending] = useActionState(async (prev: CheckinState, formData: FormData) => {
    const result = await saveCheckinAction(prev, formData);
    if (result.success) onDone();
    return result;
  }, {});
  const errors = state.errors ?? {};

  return (
    <PortalCard>
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="weekStart" value={weekStart} />
        <div>
          <PortalLabel>Check-in de la semana</PortalLabel>
          <h2 className="m-0 mt-1 text-[19px] font-extrabold tracking-[-.3px]">¿Cómo te fue esta semana?</h2>
          <p className="m-0 mt-1 text-[13px]" style={{ color: "var(--text-2)" }}>
            Hasta el {weekdayDate(checkin.closesOn)}
          </p>
        </div>

        <Question title="¿Cómo te sentiste?" error={errors.feeling}>
          <div className="grid grid-cols-5 gap-2">
            {FEELINGS.map((f) => (
              <Choice
                key={f.value}
                name="feeling"
                value={String(f.value)}
                checked={feeling === f.value}
                onSelect={() => setFeeling(f.value)}
                className="flex-col gap-1 py-2.5"
              >
                <span className="text-[26px] leading-none" aria-hidden>
                  {f.emoji}
                </span>
                <span className="text-[11px] font-semibold">{f.label}</span>
              </Choice>
            ))}
          </div>
        </Question>

        <Question
          title="¿Qué tan dura fue la semana?"
          hint={effort ? `${effort} · ${effortLabel(effort)}` : undefined}
          error={errors.effort}
        >
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <Choice
                key={n}
                name="effort"
                value={String(n)}
                checked={effort === n}
                onSelect={() => setEffort(n)}
                solid
                className="h-10 text-[14px] font-bold tabular-nums"
              >
                {n}
              </Choice>
            ))}
          </div>
        </Question>

        <Question title="¿Hiciste los entrenos?" error={errors.completion}>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(COMPLETION_LABEL) as CheckinCompletion[]).map((value) => (
              <Choice
                key={value}
                name="completion"
                value={value}
                checked={completion === value}
                onSelect={() => setCompletion(value)}
                solid
                className="h-10 text-[13px] font-semibold"
              >
                {COMPLETION_LABEL[value]}
              </Choice>
            ))}
          </div>
        </Question>

        <Question title="¿Alguna molestia o dolor?" error={errors.pain}>
          <div className="grid grid-cols-2 gap-2">
            {(["no", "yes"] as const).map((value) => (
              <Choice
                key={value}
                name="pain"
                value={value}
                checked={pain === value}
                onSelect={() => setPain(value)}
                solid
                className="h-10 text-[13px] font-semibold"
              >
                {value === "yes" ? "Sí" : "No"}
              </Choice>
            ))}
          </div>
          {pain === "yes" && (
            <div className="mt-2 flex flex-col gap-1.5">
              <Input
                name="painNote"
                maxLength={200}
                defaultValue={answer?.painNote ?? ""}
                placeholder="¿Dónde?"
                aria-label="Dónde te duele"
                autoFocus={!answer?.pain}
                className="h-10 rounded-[10px]"
              />
              <FieldError message={errors.painNote} />
            </div>
          )}
        </Question>

        <Question title={`Algo más para ${coachFirstName}`} hint="Opcional" error={errors.comment}>
          <textarea
            name="comment"
            rows={3}
            maxLength={1000}
            defaultValue={answer?.comment ?? ""}
            className="w-full resize-y rounded-[10px] border px-3 py-2 text-[13.5px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]/40"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
          />
        </Question>

        <FieldError message={errors.general} />
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={pending} className="h-10 gap-2 rounded-[10px] px-5 font-bold">
            <Send size={15} />
            {pending ? "Enviando…" : answer ? "Guardar cambios" : `Enviar a ${coachFirstName}`}
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={pending} className="h-10 rounded-[10px]">
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </PortalCard>
  );
}

function Question({
  title,
  hint,
  error,
  children,
}: {
  title: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
      <legend className="mb-2 flex w-full items-baseline justify-between gap-2 p-0">
        <span className="text-[14px] font-bold">{title}</span>
        {hint && (
          <span className="text-[12px] font-semibold" style={{ color: "var(--text-3)" }}>
            {hint}
          </span>
        )}
      </legend>
      {children}
      <FieldError message={error} />
    </fieldset>
  );
}

/** A radio styled as a tile; `solid` fills it coral when chosen, else it gets a coral ring. */
function Choice({
  name,
  value,
  checked,
  onSelect,
  solid,
  className,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
  solid?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-center rounded-[12px] border transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--coral)]/50",
        checked && solid && "border-transparent text-[var(--on-coral)]",
        checked && !solid && "ring-2 ring-[var(--coral)]",
        className
      )}
      style={{
        background: checked && solid ? "var(--coral)" : checked ? "var(--surface-3)" : "var(--surface-2)",
        borderColor: checked && solid ? "transparent" : "var(--border)",
      }}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} className="sr-only" />
      {children}
    </label>
  );
}

function Chip({ danger, children }: { danger?: boolean; children: React.ReactNode }) {
  return (
    <span
      className="rounded-full px-3 py-1 text-[12.5px] font-semibold"
      style={{
        background: danger ? "color-mix(in srgb, var(--danger) 16%, transparent)" : "var(--surface-3)",
        color: danger ? "var(--danger)" : "var(--text-2)",
      }}
    >
      {children}
    </span>
  );
}
