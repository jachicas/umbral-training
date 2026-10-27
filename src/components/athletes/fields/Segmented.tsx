"use client";

export interface SegmentedOption<T extends string> {
  id: T;
  label: string;
  disabled?: boolean;
  hint?: string;
}

/**
 * Coral-filled segmented control. Writes the selection into a hidden input so
 * the surrounding <form action={...}> picks it up without any client wiring.
 * Exposed as a labelled group of toggle buttons; `labelId` points at the
 * visible caption.
 */
export function Segmented<T extends string>({
  name,
  labelId,
  options,
  value,
  onChange,
}: {
  name: string;
  labelId: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            disabled={opt.disabled}
            title={opt.hint}
            onClick={() => onChange(opt.id)}
            className="flex h-8 min-w-[92px] flex-1 items-center justify-center rounded-lg border text-[12.5px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={
              active
                ? { background: "var(--coral)", color: "var(--on-coral)", borderColor: "transparent" }
                : { borderColor: "var(--border)", color: "var(--text-2)", background: "transparent" }
            }
          >
            {opt.label}
          </button>
        );
      })}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
