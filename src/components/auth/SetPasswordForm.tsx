"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/athletes/fields/FieldError";
import { PasswordInput } from "@/components/auth/PasswordInput";
import type { PasswordState } from "@/app/login/actions";

type PasswordAction = (prev: PasswordState, formData: FormData) => Promise<PasswordState>;

const initialState: PasswordState = {};

/** A password from a one-time link: an invite's first (`acceptInviteAction`), or a reset's new one. */
export function SetPasswordForm({ action, token, email }: { action: PasswordAction; token: string; email?: string }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      {/* Lets password managers save the new password under the right account. */}
      <input type="email" name="username" autoComplete="username" value={email ?? ""} readOnly hidden />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña nueva</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} maxLength={72} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm">Repítela</Label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" minLength={8} maxLength={72} required />
      </div>
      <FieldError message={state.error} />
      <Button type="submit" size="lg" disabled={pending} className="mt-1 h-11 rounded-xl text-[14.5px] font-semibold">
        {pending ? "Guardando…" : "Guardar y entrar"}
      </Button>
    </form>
  );
}
