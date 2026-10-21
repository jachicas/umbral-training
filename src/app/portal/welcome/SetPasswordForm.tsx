"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/athletes/fields/FieldError";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { setPasswordAction, type PasswordState } from "../actions";

const initialState: PasswordState = {};

export function SetPasswordForm({ email }: { email?: string }) {
  const [state, formAction, pending] = useActionState(setPasswordAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Lets password managers save the new password under the right account. */}
      <input type="email" name="username" autoComplete="username" value={email ?? ""} readOnly hidden />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña nueva</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm">Repítela</Label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" minLength={8} required />
      </div>
      <FieldError message={state.error} />
      <Button type="submit" size="lg" disabled={pending} className="mt-1 h-11 rounded-xl text-[14.5px] font-semibold">
        {pending ? "Guardando…" : "Guardar y entrar"}
      </Button>
    </form>
  );
}
