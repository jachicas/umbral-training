import { Bike, Dumbbell, Footprints, Waves, type LucideIcon } from "lucide-react";
import type { Discipline } from "@/lib/domain/types";
import { DISCIPLINE_META } from "@/lib/domain/discipline";

const DISCIPLINE_ICON: Record<Discipline, LucideIcon> = {
  swim: Waves,
  bike: Bike,
  run: Footprints,
  gym: Dumbbell,
};

export function DisciplineChip({ discipline }: { discipline: Discipline }) {
  const meta = DISCIPLINE_META[discipline];
  const Icon = DISCIPLINE_ICON[discipline];
  return (
    <span
      className="inline-flex items-center gap-[5px] rounded-full py-1 pr-[9px] pl-[7px] text-[11.5px] font-bold"
      style={{ background: meta.tintVar, color: meta.colorVar }}
    >
      <Icon size={13} />
      {meta.label}
    </span>
  );
}
