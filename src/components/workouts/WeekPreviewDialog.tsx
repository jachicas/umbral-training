"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import type { AthletePaces, WeekPlan } from "@/lib/domain/workouts";
import { planSessions, sessionRelativeSteps, stepKey } from "@/lib/domain/workouts";
import { DISCIPLINE_META } from "@/lib/domain/discipline";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DISCIPLINE_ICON } from "./discipline-icons";
import { dayLabel, describeSession } from "./format";

/**
 * The athlete's week as they'll receive it, with their own paces: a quick
 * check before sending (and the base for the PDF).
 */
export function WeekPreviewButton({
  athleteName,
  weekLabel,
  weekDates,
  plan,
  paces,
}: {
  athleteName: string;
  weekLabel: string;
  weekDates: string[];
  plan: WeekPlan;
  paces: AthletePaces;
}) {
  const [open, setOpen] = useState(false);

  const anyEstimated = planSessions(plan).some((session) =>
    sessionRelativeSteps(session).some((step) => paces[stepKey(session.id, step.id)]?.estimated)
  );
  const missingPaces = planSessions(plan).some((session) =>
    sessionRelativeSteps(session).some((step) => !paces[stepKey(session.id, step.id)])
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-[40px] items-center gap-1.5 rounded-[10px] border px-4 text-[13px] font-bold"
        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
      >
        <Eye size={15} /> Vista previa
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-[18px] sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{athleteName}</DialogTitle>
            <DialogDescription>{weekLabel}</DialogDescription>
          </DialogHeader>

          <div className="-mx-1 flex max-h-[65vh] flex-col overflow-y-auto px-1">
            {plan.days.map((sessions, dayIndex) => (
              <div
                key={dayIndex}
                className="grid grid-cols-[64px_1fr] gap-3 border-t py-3 first:border-t-0"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="pt-0.5 text-[12px] font-bold tracking-[.03em] uppercase" style={{ color: "var(--text-3)" }}>
                  {dayLabel(weekDates[dayIndex])}
                </div>
                {sessions.length === 0 ? (
                  <div className="text-[13px]" style={{ color: "var(--text-3)" }}>
                    Descanso
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {sessions.map((session) => {
                      const Icon = DISCIPLINE_ICON[session.discipline];
                      return (
                        <div key={session.id} className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-[14px] font-bold">
                            <Icon size={14} style={{ color: DISCIPLINE_META[session.discipline].colorVar }} />
                            {session.name}
                          </div>
                          <ul className="m-0 flex list-none flex-col gap-0.5 p-0 text-[13px]" style={{ color: "var(--text-2)" }}>
                            {describeSession(session, { paces }).map((line, i) => (
                              <li key={i}>{line}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {(anyEstimated || missingPaces) && (
            <div className="border-t pt-3 text-[12px]" style={{ borderColor: "var(--border)", color: "var(--text-3)" }}>
              {anyEstimated && "Algunos ritmos se estimaron a partir de otra distancia. "}
              {missingPaces && "Sin marcas para algunas distancias: esos pasos se muestran en %."}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
