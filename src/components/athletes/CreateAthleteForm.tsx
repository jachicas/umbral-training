"use client";

import { useActionState, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createAthleteAction, type CreateAthleteState } from "@/app/athletes/actions";
import { AthleteIdentityFields } from "./fields/AthleteIdentityFields";
import { SportProfileFields } from "./fields/SportProfileFields";
import { GoalWizard } from "./fields/GoalWizard";
import type { Race } from "@/lib/domain/types";
import { FieldError } from "./fields/FieldError";

const initialState: CreateAthleteState = {};

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="flex flex-col gap-4 rounded-[18px] border p-[22px] shadow-[var(--shadow)]"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div>
        <div className="text-base font-bold">{title}</div>
        {description && (
          <div className="mt-0.5 text-[13px]" style={{ color: "var(--text-2)" }}>
            {description}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

/**
 * Full onboarding, one <form> across four cards. Field groups (identity,
 * sport profile, goal) are the same ones the athlete profile's edit dialogs use, so
 * creation and later edits never drift into different shapes.
 */
export function CreateAthleteForm({ races }: { races: Race[] }) {
  const [state, formAction, pending] = useActionState(createAthleteAction, initialState);
  const [email, setEmail] = useState("");
  const [sendNow, setSendNow] = useState(false);

  const errors = state.errors ?? {};
  const hasEmail = email.trim().length > 0;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex min-w-0 flex-col gap-4">
          <SectionCard title="Datos del atleta">
            <AthleteIdentityFields errors={errors} onEmailChange={setEmail} />
          </SectionCard>

          <SectionCard title="Perfil deportivo">
            <SportProfileFields errors={errors} />
          </SectionCard>
        </div>

        <div className="flex flex-col gap-4">
          <SectionCard title="Objetivo">
            <GoalWizard races={races} errors={errors} />
          </SectionCard>

          <SectionCard title="Acceso">
            <label
              className="flex items-center gap-2 text-sm font-medium"
              style={{ opacity: hasEmail ? 1 : 0.6, cursor: hasEmail ? "pointer" : "not-allowed" }}
            >
              <input
                type="checkbox"
                name="sendInviteNow"
                disabled={!hasEmail}
                checked={sendNow && hasEmail}
                onChange={(e) => setSendNow(e.target.checked)}
                style={{ accentColor: "var(--coral)" }}
              />
              Enviar invitación por email ahora
            </label>
            {!hasEmail && (
              <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
                Requiere email.
              </p>
            )}
          </SectionCard>
        </div>
      </div>

      <FieldError message={errors.general} />

      <div className="flex justify-end gap-2.5">
        <Link
          href="/athletes"
          className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-[10px]")}
        >
          Cancelar
        </Link>
        <Button type="submit" disabled={pending} className="h-10 rounded-[10px] font-bold">
          {pending ? "Creando…" : "Crear ficha"}
        </Button>
      </div>
    </form>
  );
}
