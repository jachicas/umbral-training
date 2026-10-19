"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterOption<T extends string> = { value: T; label: string };

/**
 * A compact dropdown filter: "Label · Value ▾". It tints coral while it holds
 * anything other than its default value, so an active filter is easy to spot.
 */
export function FilterSelect<T extends string>({
  label,
  value,
  defaultValue,
  options,
  onChange,
}: {
  label: string;
  value: T;
  defaultValue: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
}) {
  const active = value !== defaultValue;

  return (
    <Select.Root
      items={options}
      value={value}
      onValueChange={(v) => {
        if (v !== null) onChange(v as T);
      }}
    >
      <Select.Trigger
        aria-label={label}
        className={cn(
          "group inline-flex h-9 items-center gap-2 rounded-[9px] border pr-2.5 pl-3 text-[13px] font-semibold whitespace-nowrap outline-none transition-colors select-none",
          "focus-visible:ring-2 focus-visible:ring-[var(--coral)]/40",
          active
            ? // The tint is translucent, so it is painted over the surface to keep it readable on the glass.
              "border-[color-mix(in_srgb,var(--coral)_40%,transparent)] bg-[var(--surface)] shadow-[inset_0_0_0_999px_var(--coral-tint)] hover:shadow-[inset_0_0_0_999px_var(--coral-tint-2)] data-popup-open:shadow-[inset_0_0_0_999px_var(--coral-tint-2)]"
            : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] data-popup-open:bg-[var(--surface-2)]"
        )}
      >
        <span className="text-xs font-bold tracking-[.03em] uppercase" style={{ color: active ? "var(--coral)" : "var(--text-3)" }}>
          {label}
        </span>
        <Select.Value style={{ color: active ? "var(--coral)" : "var(--text)" }} />
        <Select.Icon
          className="transition-transform duration-150 group-data-popup-open:rotate-180"
          style={{ color: active ? "var(--coral)" : "var(--text-3)" }}
        >
          <ChevronDown size={14} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="z-50 outline-none" sideOffset={6} align="start" alignItemWithTrigger={false}>
          <Select.Popup
            className={cn(
              "min-w-[max(var(--anchor-width),9rem)] origin-[var(--transform-origin)] rounded-[10px] border p-1 outline-none",
              "shadow-[var(--shadow-lg)] backdrop-blur-2xl backdrop-saturate-150",
              "transition-[scale,opacity] duration-100 ease-out data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0"
            )}
            style={{ background: "var(--glass-strong)", borderColor: "var(--border)", color: "var(--text)" }}
          >
            <Select.List className="max-h-[var(--available-height)] overflow-y-auto">
              {options.map((o) => (
                <Select.Item
                  key={o.value}
                  value={o.value}
                  className={cn(
                    "grid cursor-default grid-cols-[1fr_14px] items-center gap-3 rounded-[7px] py-2 pr-2.5 pl-2.5 text-[13px] font-semibold outline-none select-none",
                    "data-highlighted:bg-[var(--surface-3)] data-[selected]:text-[var(--coral)]"
                  )}
                >
                  <Select.ItemText>{o.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={14} strokeWidth={2.5} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
