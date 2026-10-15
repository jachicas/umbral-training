"use client";

import { useState } from "react";
import { DISCIPLINE_META, DISCIPLINE_ORDER } from "@/lib/domain/discipline";
import type { Discipline } from "@/lib/domain/types";

/** Multi-select discipline chips, submitted as repeated hidden `disciplines` inputs. */
export function DisciplinePicker({
  labelId,
  defaultValue,
  onChange,
}: {
  labelId: string;
  defaultValue: Discipline[];
  onChange?: (disciplines: Discipline[]) => void;
}) {
  const [selected, setSelected] = useState<Discipline[]>(defaultValue);

  function toggle(d: Discipline) {
    const next = selected.includes(d) ? selected.filter((x) => x !== d) : [...selected, d];
    setSelected(next);
    onChange?.(next);
  }

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-1.5">
      {DISCIPLINE_ORDER.map((d) => {
        const meta = DISCIPLINE_META[d];
        const active = selected.includes(d);
        return (
          <button
            key={d}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(d)}
            className="rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition-colors"
            style={
              active
                ? { background: meta.tintVar, color: meta.colorVar, borderColor: "transparent" }
                : { borderColor: "var(--border)", color: "var(--text-2)", background: "transparent" }
            }
          >
            {meta.label}
          </button>
        );
      })}
      {selected.map((d) => (
        <input key={d} type="hidden" name="disciplines" value={d} />
      ))}
    </div>
  );
}
