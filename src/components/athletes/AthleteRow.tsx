import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AthleteAvatar } from "./AthleteAvatar";
import { DisciplineIcon } from "./DisciplineIcon";
import { AccessStatusPill } from "./AccessStatusPill";
import { InviteAccessControl } from "./InviteAccessControl";
import { paymentDisplayMeta } from "@/lib/domain/payments";
import type { AthleteRowVM } from "./types";

export const ATHLETE_ROW_GRID_COLS = "1.7fr .5fr .8fr .55fr minmax(150px,1.15fr) 20px";

export function AthleteRow({ athlete: a }: { athlete: AthleteRowVM }) {
  const payMeta = paymentDisplayMeta(a.paymentStatus, a.paymentConfigured);

  return (
    <Link
      href={`/athletes/${a.id}`}
      className="grid items-center gap-4 px-5 py-[13px] text-[13.5px] transition-colors hover:bg-[var(--surface-2)]"
      style={{ gridTemplateColumns: ATHLETE_ROW_GRID_COLS, color: "var(--text)" }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <AthleteAvatar fullName={a.fullName} color={a.avatarColor} size={32} radius={999} />
        <div className="min-w-0">
          <div className="truncate font-semibold">{a.fullName}</div>
          <div className="truncate text-[12px]" style={{ color: "var(--text-3)" }}>
            {a.email ?? "Sin email"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {a.disciplines.map((d) => (
          <DisciplineIcon key={d} discipline={d} />
        ))}
      </div>

      <div className="min-w-0 truncate">{a.objectiveLabel}</div>

      <div className="truncate font-semibold" style={{ color: payMeta.colorVar }}>
        {payMeta.label}
      </div>

      <div className="flex min-w-0 items-center gap-2.5">
        <AccessStatusPill status={a.accessStatus} />
        <InviteAccessControl
          athleteId={a.id}
          status={a.accessStatus}
          email={a.email}
          variant="row"
        />
      </div>

      <ChevronRight size={16} className="flex-none justify-self-end" style={{ color: "var(--text-3)" }} />
    </Link>
  );
}
