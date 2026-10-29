"use client";

import { useEffect, useRef } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A native checkbox drawn in the app's colors: a soft outline, filled with
 * the club's color once checked. `indeterminate` (some, not all) shows a dash.
 */
export function Checkbox({
  checked,
  indeterminate = false,
  disabled = false,
  label,
  onChange,
  className,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label: string;
  onChange: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  // `indeterminate` is a DOM property only, with no attribute for React to set.
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <span className={cn("relative inline-flex size-[18px] flex-none", className)}>
      <input
        ref={ref}
        type="checkbox"
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="peer size-full cursor-pointer appearance-none rounded-[5px] border-[1.5px] border-[color-mix(in_srgb,var(--text-3)_65%,transparent)] bg-transparent transition-[background-color,border-color] duration-150 outline-none not-checked:not-indeterminate:hover:border-[var(--text-2)] checked:border-[var(--coral)] checked:bg-[var(--coral)] indeterminate:border-[var(--coral)] indeterminate:bg-[var(--coral)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--coral)] disabled:cursor-not-allowed disabled:opacity-40"
      />
      <Check
        size={12}
        strokeWidth={3.5}
        aria-hidden
        className="pointer-events-none absolute inset-0 m-auto scale-50 opacity-0 transition-[opacity,transform] duration-150 peer-checked:scale-100 peer-checked:opacity-100"
        style={{ color: "var(--on-coral)" }}
      />
      <Minus
        size={12}
        strokeWidth={3.5}
        aria-hidden
        className="pointer-events-none absolute inset-0 m-auto opacity-0 peer-indeterminate:opacity-100"
        style={{ color: "var(--on-coral)" }}
      />
    </span>
  );
}
