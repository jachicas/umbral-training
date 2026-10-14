import type { Metadata } from "next";
import { getCurrentCoachId } from "@/lib/supabase/auth";
import { listAthleteDetails } from "@/lib/services/athletes";
import { listGroups } from "@/lib/services/workouts";
import { WorkoutsHeader } from "@/components/workouts/WorkoutsHeader";
import { GroupSelect } from "@/components/workouts/GroupSelect";
import { AthleteAvatar } from "@/components/athletes/AthleteAvatar";
import { countLabel } from "@/components/workouts/format";
import { objectiveLabel } from "../week";

export const metadata: Metadata = { title: "Grupos · Umbral Training" };

export default async function GroupsPage() {
  const coachId = await getCurrentCoachId();
  const [details, groups] = await Promise.all([listAthleteDetails(coachId), listGroups(coachId)]);
  const groupOptions = groups.map((g) => ({ id: g.id, name: g.name }));
  const ungrouped = details.filter((d) => !groups.some((g) => g.athleteIds.includes(d.athlete.id)));

  const columns = [
    ...groups.map((g) => ({
      id: g.id as string | null,
      name: g.name,
      members: details.filter((d) => g.athleteIds.includes(d.athlete.id)),
    })),
    ...(ungrouped.length > 0 ? [{ id: null, name: "Sin grupo", members: ungrouped }] : []),
  ];

  return (
    <div className="flex flex-col gap-5">
      <WorkoutsHeader
        active="groups"
        subtitle="Cada grupo recibe la misma semana; cada atleta, con sus propios ritmos"
        actions={null}
      />

      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        {columns.map((col) => (
          <div
            key={col.id ?? "none"}
            className="rounded-[18px] border p-5 shadow-[var(--shadow)]"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              borderStyle: col.id ? "solid" : "dashed",
            }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-[15px] font-bold">{col.name}</div>
              <div className="text-[12px]" style={{ color: "var(--text-3)" }}>
                {countLabel(col.members.length, "atleta", "atletas")}
              </div>
            </div>
            {col.id === null && (
              <div className="mt-1 text-[12px]" style={{ color: "var(--text-3)" }}>
                No reciben semana hasta que estén en un grupo.
              </div>
            )}
            <div className="mt-3 flex flex-col gap-1">
              {col.members.map((d) => (
                <div key={d.athlete.id} className="flex items-center gap-2.5 rounded-[10px] px-1.5 py-1.5">
                  <AthleteAvatar fullName={d.athlete.fullName} color={d.athlete.avatarColor} size={30} radius={9} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold">{d.athlete.fullName}</div>
                    <div className="truncate text-[11.5px]" style={{ color: "var(--text-3)" }}>
                      {objectiveLabel(d)}
                    </div>
                  </div>
                  <GroupSelect
                    athleteId={d.athlete.id}
                    athleteName={d.athlete.fullName}
                    groupId={col.id}
                    groups={groupOptions}
                  />
                </div>
              ))}
              {col.members.length === 0 && (
                <div className="py-3 text-[12.5px]" style={{ color: "var(--text-3)" }}>
                  Nadie en este grupo.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
