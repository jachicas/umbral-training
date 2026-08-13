import type { Discipline } from "@/lib/domain/types";
import { DISCIPLINE_META } from "@/lib/domain/discipline";

/** Bare Tabler icon, colored by discipline, with the label as a native tooltip. */
export function DisciplineIcon({ discipline }: { discipline: Discipline }) {
  const meta = DISCIPLINE_META[discipline];
  return (
    <i
      className={`ti ${meta.ti}`}
      title={meta.label}
      aria-label={meta.label}
      style={{ fontSize: 19, color: meta.colorVar }}
    />
  );
}
