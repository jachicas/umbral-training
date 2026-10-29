"use client";

import { Input } from "@/components/ui/input";

/** A duration as typed: hours, minutes and seconds each in its own box, so "2" "40" can't be read as 2:40 min. */
export interface DurationParts {
  h: string;
  m: string;
  s: string;
}

export const BLANK_DURATION: DurationParts = { h: "", m: "", s: "" };

export function durationParts(totalSeconds: number | undefined | null): DurationParts {
  if (!totalSeconds) return BLANK_DURATION;
  const seconds = Math.round(totalSeconds);
  const h = Math.floor(seconds / 3600);
  return {
    h: h > 0 ? String(h) : "",
    m: String(Math.floor((seconds % 3600) / 60)),
    s: String(seconds % 60).padStart(2, "0"),
  };
}

/** "h:mm:ss" for the services to parse, or "" when every box is empty. */
export function joinDuration({ h, m, s }: DurationParts): string {
  if (!h && !m && !s) return "";
  return `${h || "0"}:${(m || "0").padStart(2, "0")}:${(s || "0").padStart(2, "0")}`;
}

const UNITS = [
  { key: "h", unit: "h", label: "Horas" },
  { key: "m", unit: "min", label: "Minutos" },
  { key: "s", unit: "s", label: "Segundos" },
] as const;

export function DurationInput({
  id,
  value,
  onChange,
  invalid,
  of,
}: {
  /** Goes on the hours box, for the field's <Label>. */
  id?: string;
  value: DurationParts;
  onChange: (value: DurationParts) => void;
  invalid?: boolean;
  /** Whose time it is, when several sit side by side ("Minutos, Ana López"). */
  of?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {UNITS.map(({ key, unit, label }) => (
        <label key={key} className="flex min-w-0 flex-1 items-center gap-1">
          <Input
            id={key === "h" ? id : undefined}
            aria-label={of ? `${label}, ${of}` : label}
            aria-invalid={invalid || undefined}
            inputMode="numeric"
            maxLength={2}
            className="text-center tabular-nums"
            value={value[key]}
            onChange={(e) => onChange({ ...value, [key]: e.target.value.replace(/\D/g, "") })}
          />
          <span className="text-[12.5px]" style={{ color: "var(--text-3)" }}>
            {unit}
          </span>
        </label>
      ))}
    </div>
  );
}
