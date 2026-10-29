import type { Metadata } from "next";
import { getCurrentCoachId } from "@/lib/auth/current-user";
import { listAthleteDetails } from "@/lib/services/athletes";
import { RecordsOverview, type RecentMarkVM } from "@/components/records/RecordsOverview";
import { toRecordAthlete } from "@/components/records/types";

export const metadata: Metadata = { title: "Marcas · Umbral Training" };

const RECENT_COUNT = 8;

export default async function RecordsPage() {
  const coachId = await getCurrentCoachId();
  const details = await listAthleteDetails(coachId);

  const recent: RecentMarkVM[] = details
    .flatMap((d) =>
      d.records.map((r) => ({
        id: r.id,
        athleteId: d.athlete.id,
        fullName: d.athlete.fullName,
        avatarColor: d.athlete.avatarColor,
        reference: r.reference,
        timeSeconds: r.timeSeconds,
        recordedOn: r.recordedOn,
      }))
    )
    .sort((a, b) => b.recordedOn.localeCompare(a.recordedOn))
    .slice(0, RECENT_COUNT);

  return <RecordsOverview athletes={details.map(toRecordAthlete)} recent={recent} />;
}
