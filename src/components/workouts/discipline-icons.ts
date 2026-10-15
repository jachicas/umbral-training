import { Bike, Dumbbell, Footprints, Waves, type LucideIcon } from "lucide-react";
import type { Discipline } from "@/lib/domain/types";

/** One icon per discipline, for places that can't load the Tabler font. */
export const DISCIPLINE_ICON: Record<Discipline, LucideIcon> = {
  swim: Waves,
  bike: Bike,
  run: Footprints,
  gym: Dumbbell,
};
