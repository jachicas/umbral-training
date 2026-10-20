"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/athletes/fields/FieldError";
import { updateProfileAction, type ProfileState } from "@/app/portal/actions";
import type { PortalAthlete } from "@/lib/domain/portal";

const initialState: ProfileState = {};

/** The bits the athlete keeps up to date themselves: phone and how much they can train. */
export function ProfileForm({ athlete }: { athlete: PortalAthlete }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={athlete.phone ?? ""} placeholder="7777-1234" />
        <FieldError message={errors.phone} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="weeklyAvailabilityDays">Días por semana</Label>
          <Input
            id="weeklyAvailabilityDays"
            name="weeklyAvailabilityDays"
            type="number"
            inputMode="numeric"
            min={1}
            max={7}
            defaultValue={athlete.weeklyAvailabilityDays ?? ""}
          />
          <FieldError message={errors.weeklyDays} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="weeklyAvailabilityHours">Horas por semana</Label>
          <Input
            id="weeklyAvailabilityHours"
            name="weeklyAvailabilityHours"
            inputMode="decimal"
            defaultValue={athlete.weeklyAvailabilityHours ?? ""}
            placeholder="6,5"
          />
          <FieldError message={errors.weeklyHours} />
        </div>
      </div>
      <FieldError message={errors.general} />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="h-10 rounded-[10px] px-5 font-bold">
          {pending ? "Guardando…" : "Guardar"}
        </Button>
        {state.success && !pending && (
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: "var(--ok)" }}>
            <Check size={15} /> Guardado
          </span>
        )}
      </div>
    </form>
  );
}
