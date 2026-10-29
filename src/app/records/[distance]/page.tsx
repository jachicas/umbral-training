import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentCoachId } from "@/lib/auth/current-user";
import { listAthleteDetails } from "@/lib/services/athletes";
import { RACE_REFERENCES } from "@/lib/domain/time";
import type { RaceReference } from "@/lib/domain/types";
import { RecordSheet } from "@/components/records/RecordSheet";
import { toRecordAthlete } from "@/components/records/types";

export const metadata: Metadata = { title: "Marcas · Umbral Training" };

export default async function DistanceRecordsPage({ params }: { params: Promise<{ distance: string }> }) {
  const { distance } = await params;
  if (!RACE_REFERENCES.includes(distance as RaceReference)) notFound();

  const coachId = await getCurrentCoachId();
  const details = await listAthleteDetails(coachId);

  return <RecordSheet athletes={details.map(toRecordAthlete)} initialReference={distance as RaceReference} />;
}
