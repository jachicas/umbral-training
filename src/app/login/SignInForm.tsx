"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/athletes/fields/FieldError";
import { signInAction, type SignInState } from "./actions";

const initialState: SignInState = {};

const fieldClass = "h-11 rounded-xl px-3.5 text-[14px] md:text-[14px] dark:bg-white/5";

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

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
          className={fieldClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${fieldClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center transition-colors hover:text-[var(--text)]"
            style={{ color: "var(--text-3)" }}
          >
            {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        </div>
      </div>
      <FieldError message={state.error} />
      <Button type="submit" size="lg" disabled={pending} className="mt-1 h-11 rounded-xl text-[14.5px] font-semibold">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
