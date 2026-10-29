"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { AthleteRow, athleteRowGridCols } from "./AthleteRow";
import type { AthleteRowVM } from "./types";

/** Who can be picked to invite: anyone without portal access yet who has an email to send it to. */
export const isInvitable = (a: AthleteRowVM) => a.accessStatus !== "linked" && !!a.email;

/** `selected` and `onSelectedChange` turn on the checkboxes, to invite several athletes at once. */
export function AthleteTable({
  athletes,
  selected,
  onSelectedChange,
}: {
  athletes: AthleteRowVM[];
  selected?: Set<string>;
  onSelectedChange?: (next: Set<string>) => void;
}) {
  const selectable = selected !== undefined && onSelectedChange !== undefined;
  const invitable = athletes.filter(isInvitable);
  const pickedCount = selectable ? invitable.filter((a) => selected.has(a.id)).length : 0;
  const allPicked = invitable.length > 0 && pickedCount === invitable.length;

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedChange?.(next);
  }

  function toggleAll() {
    const next = new Set(selected);
    for (const a of invitable) {
      if (allPicked) next.delete(a.id);
      else next.add(a.id);
    }
    onSelectedChange?.(next);
  }

  return (
    <div
      className="overflow-hidden rounded-[10px] border"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div
        className="grid items-center gap-4 px-5 py-2.5 text-[11.5px] font-semibold tracking-[.03em] uppercase"
        style={{
          gridTemplateColumns: athleteRowGridCols(selectable),
          background: "var(--surface-2)",
          color: "var(--text-3)",
        }}
      >
        {selectable && (
          <Checkbox
            label="Seleccionar todos"
            checked={allPicked}
            indeterminate={pickedCount > 0 && !allPicked}
            disabled={invitable.length === 0}
            onChange={toggleAll}
          />
        )}
        <span>Atleta</span>
        <span>Disciplinas</span>
        <span>Objetivo</span>
        <span>Pago</span>
        <span>Acceso</span>
        <span />
      </div>

      <div>
        {athletes.map((a, i) => (
          <div key={a.id} style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}>
            <AthleteRow
              athlete={a}
              selection={
                selectable
                  ? { checked: selected.has(a.id), disabled: !isInvitable(a), onToggle: () => toggle(a.id) }
                  : undefined
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
