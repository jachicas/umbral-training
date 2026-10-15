"use client";

import { useState, useTransition } from "react";
import { moveAthleteAction } from "@/app/workouts/actions";

const NO_GROUP = "";

/** Moves an athlete to another group; the week they receive follows the new group. */
export function GroupSelect({
  athleteId,
  athleteName,
  groupId,
  groups,
}: {
  athleteId: string;
  athleteName: string;
  groupId: string | null;
  groups: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <span className="flex flex-col items-end gap-0.5">
      <select
        aria-label={`Grupo de ${athleteName}`}
        value={groupId ?? NO_GROUP}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value || null;
          startTransition(async () => setError((await moveAthleteAction(athleteId, next)).error));
        }}
        className="h-8 max-w-[180px] rounded-[8px] border px-2 text-[12px] font-semibold disabled:opacity-50"
        style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
      >
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
        <option value={NO_GROUP}>Sin grupo</option>
      </select>
      {error && (
        <span className="text-[11px] font-semibold" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </span>
  );
}
