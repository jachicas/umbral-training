"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

export const authFieldClass = "h-11 rounded-xl px-3.5 text-[14px] md:text-[14px] dark:bg-white/5";

/** A password field with a button that shows what was typed. */
export function PasswordInput(props: Omit<ComponentProps<typeof Input>, "type" | "className">) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className={`${authFieldClass} pr-11`} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        title={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center transition-colors hover:text-[var(--text)]"
        style={{ color: "var(--text-3)" }}
      >
        {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </div>
  );
}
