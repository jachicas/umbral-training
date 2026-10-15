"use client";

import { useState, useTransition } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { moveAthleteAction } from "@/app/workouts/actions";

const NO_GROUP = "none";
const PLACEHOLDER = "";

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

  // Nowhere to move them (no other group, and already ungrouped).
  if (groupId === null && groups.length === 0) return null;

  return (
    <span className="flex flex-col items-end gap-0.5">
      {/* The card already says which group they're in: the menu only offers the others. */}
      <NativeSelect
        aria-label={`Mover a ${athleteName} a otro grupo`}
        value={PLACEHOLDER}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value === NO_GROUP ? null : e.target.value;
          startTransition(async () => setError((await moveAthleteAction(athleteId, next)).error));
        }}
        className="h-8 max-w-[180px] text-[12px]"
        style={{ color: "var(--text-2)" }}
      >
        <option value={PLACEHOLDER} disabled hidden>
          Mover a…
        </option>
        {groups
          .filter((g) => g.id !== groupId)
          .map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        {groupId !== null && <option value={NO_GROUP}>Sin grupo</option>}
      </NativeSelect>
      {error && (
        <span className="text-[11px] font-semibold" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </span>
  );
}
