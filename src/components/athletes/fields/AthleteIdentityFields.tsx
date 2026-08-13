"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ATHLETE_SEX_LABEL } from "@/lib/domain/athlete-profile";
import type { AthleteSex } from "@/lib/domain/types";
import type { ValidationField } from "@/lib/services/athletes";
import { FieldError } from "./FieldError";
import { Segmented } from "./Segmented";

type Errors = Partial<Record<ValidationField, string>>;

/**
 * Name, contact and biographical basics — shared by the create page and the
 * "Editar atleta" dialog so the two never drift apart. `onEmailChange` lets
 * the create page gate its "invite now" checkbox.
 */
export function AthleteIdentityFields({
  defaultFullName = "",
  defaultEmail = "",
  defaultPhone = "",
  defaultBirthDate = "",
  defaultSex,
  errors,
  emailHint = "Necesario solo si vas a invitarle.",
  onEmailChange,
}: {
  defaultFullName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
  defaultBirthDate?: string;
  defaultSex?: AthleteSex;
  errors?: Errors;
  emailHint?: string;
  onEmailChange?: (email: string) => void;
}) {
  // Controlled on purpose: React resets uncontrolled fields once a form action
  // completes, which would wipe the coach's input every failed validation.
  const [fullName, setFullName] = useState(defaultFullName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [birthDate, setBirthDate] = useState(defaultBirthDate);
  const [sex, setSex] = useState<AthleteSex | "">(defaultSex ?? "");

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input
          id="fullName"
          name="fullName"
          placeholder="Marta Ríos"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <FieldError message={errors?.fullName} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="marta@ejemplo.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            onEmailChange?.(e.target.value);
          }}
        />
        <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
          {emailHint}
        </p>
        <FieldError message={errors?.email} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+34 600 000 000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
          Opcional — para hablar por WhatsApp.
        </p>
      </div>

      <div className="flex gap-2.5">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="birthDate">Fecha de nacimiento</Label>
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
          <FieldError message={errors?.birthDate} />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label>Sexo</Label>
          <Segmented
            name="sex"
            value={sex}
            onChange={setSex}
            options={[
              { id: "" as const, label: "—" },
              { id: "female" as const, label: ATHLETE_SEX_LABEL.female },
              { id: "male" as const, label: ATHLETE_SEX_LABEL.male },
            ]}
          />
        </div>
      </div>
    </>
  );
}
