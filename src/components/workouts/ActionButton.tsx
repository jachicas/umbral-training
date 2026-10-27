"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/app/workouts/actions";

/** Button bound to a server action; shows the action's error inline. */
export function ActionButton({
  action,
  variant = "primary",
  className,
  children,
}: {
  action: () => Promise<ActionState | void>;
  variant?: "primary" | "secondary";
  className?: string;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await action();
            setError(result?.error);
          })
        }
        className={cn(
          "flex h-[38px] items-center gap-1.5 rounded-[10px] px-4 text-[13px] font-bold transition-[filter] hover:brightness-110 disabled:opacity-60",
          variant === "primary" ? "text-[var(--on-coral)] shadow-[var(--shadow)]" : "border",
          className
        )}
        style={
          variant === "primary"
            ? { background: "var(--coral)" }
            : { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }
        }
      >
        {children}
      </button>
      {error && (
        <span className="text-[11.5px] font-semibold" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </span>
  );
}
