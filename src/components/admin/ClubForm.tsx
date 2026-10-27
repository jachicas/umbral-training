"use client";

import { startTransition, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/athletes/fields/FieldError";
import type { ClubFormState } from "@/app/admin/actions";
import type { Club, PaletteKey } from "@/lib/domain/clubs";
import type { ValidationField } from "@/lib/services/errors";

type ClubFormAction = (prev: ClubFormState, formData: FormData) => Promise<ClubFormState>;

const COLORS: { key: PaletteKey; label: string; field: ValidationField }[] = [
  { key: "primary", label: "Principal", field: "primaryColor" },
  { key: "accent", label: "Acento", field: "accentColor" },
  { key: "sidebar", label: "Menú", field: "sidebarColor" },
];

/** Umbral's coral, the starting point of a color the club didn't set. */
const UMBRAL_CORAL = "#e1573c";

const inputClass = "h-10 rounded-[9px] px-3 text-[14px]";

/** The club's name and colors; creating one also names its coach, who gets the invite. */
export function ClubForm({
  action,
  club,
  withCoach = false,
  submitLabel,
  pendingLabel,
}: {
  action: ClubFormAction;
  club?: Club;
  withCoach?: boolean;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.errors ?? {};

  // Dispatched by hand: React resets a `<form action>` after it runs, which
  // would uncheck the colors' controlled checkboxes while their state stays on.
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" defaultValue={club?.name} required maxLength={80} className={inputClass} />
        <FieldError message={errors.name} />
      </div>

      {withCoach && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coachName">Coach</Label>
            <Input id="coachName" name="coachName" required maxLength={120} autoComplete="off" className={inputClass} />
            <FieldError message={errors.coachName} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coachEmail">Email del coach</Label>
            <Input id="coachEmail" name="coachEmail" type="email" required autoComplete="off" className={inputClass} />
            <FieldError message={errors.coachEmail} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {COLORS.map(({ key, label, field }) => (
          <ColorField key={key} name={key} label={label} initial={club?.palette[key]?.color} error={errors[field]} />
        ))}
      </div>

      <FieldError message={errors.general} />
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="h-10 rounded-[10px] px-5 text-[13.5px] font-bold"
          style={{ background: "var(--coral)", color: "var(--on-coral)" }}
        >
          {pending ? pendingLabel : submitLabel}
        </Button>
        {state.success && !pending && (
          <span className="text-[13px] font-semibold" style={{ color: "var(--ok)" }}>
            Guardado
          </span>
        )}
      </div>
    </form>
  );
}

/** A color of the club's own, or Umbral's (unchecked: the API gets null). */
function ColorField({ name, label, initial, error }: { name: PaletteKey; label: string; initial?: string; error?: string }) {
  const [own, setOwn] = useState(initial !== undefined);
  const [color, setColor] = useState(initial ?? UMBRAL_CORAL);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`${name}-color`}>{label}</Label>
      <div
        className="flex h-10 items-center gap-2.5 rounded-[9px] border px-2.5"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      >
        <input
          id={`${name}-color`}
          type="color"
          name={name}
          value={color}
          disabled={!own}
          onChange={(e) => setColor(e.target.value)}
          className="size-7 flex-none cursor-pointer rounded-md border-0 bg-transparent p-0 disabled:cursor-default disabled:opacity-40"
        />
        <span className="flex-1 font-mono text-[13px]" style={{ color: own ? "var(--text)" : "var(--text-3)" }}>
          {own ? color : "Umbral"}
        </span>
        <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text-2)" }}>
          <input type="checkbox" name={`${name}Set`} checked={own} onChange={(e) => setOwn(e.target.checked)} />
          Propio
        </label>
      </div>
      <FieldError message={error} />
    </div>
  );
}
