"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/athletes/fields/FieldError";
import { PasswordInput, authFieldClass } from "@/components/auth/PasswordInput";
import { signInAction, type SignInState } from "./actions";

const initialState: SignInState = {};

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        {/* Keyed by the last attempt: a new default value needs a fresh field (Base UI warns otherwise). */}
        <Input
          key={state.email ?? ""}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          defaultValue={state.email}
          required
          className={authFieldClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </div>
      <FieldError message={state.error} />
      <Button type="submit" size="lg" disabled={pending} className="mt-1 h-11 rounded-xl text-[14.5px] font-semibold">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
