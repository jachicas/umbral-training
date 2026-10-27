"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/athletes/fields/FieldError";
import { authFieldClass } from "@/components/auth/PasswordInput";
import { forgotPasswordAction, type ForgotState } from "@/app/login/actions";

const initialState: ForgotState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  if (state.sent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="m-0 text-[14.5px] font-semibold">Revisa tu correo.</p>
        <Link href="/login" className="text-[13.5px] font-semibold" style={{ color: "var(--coral)" }}>
          Volver a entrar
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required className={authFieldClass} />
      </div>
      <FieldError message={state.error} />
      <Button type="submit" size="lg" disabled={pending} className="mt-1 h-11 rounded-xl text-[14.5px] font-semibold">
        {pending ? "Enviando…" : "Enviar enlace"}
      </Button>
      <Link href="/login" className="text-center text-[13.5px] font-semibold" style={{ color: "var(--text-2)" }}>
        Volver a entrar
      </Link>
    </form>
  );
}
