import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, ChevronLeft, ChevronRight, Check, Flag, Plus, Target } from "lucide-react";
import { getCurrentCoachId } from "@/lib/supabase/auth";
import { getAthleteDetail } from "@/lib/services/athletes";
import { markPeriodPaidAction } from "../actions";
import {
  RACE_REFERENCES,
  formatDuration,
  formatDateEs,
  formatPacePerKm,
  computePaceSecondsPerKm,
} from "@/lib/domain/time";
import { historyFor, latestRecordFor } from "@/lib/domain/records";
import {
  isRaceGoal,
  isRaceGoalDefined,
  goalDaysRemaining,
  formatGoalPace,
  goalSummaryLabel,
} from "@/lib/domain/goals";
import {
  MEMBERSHIP_MODE_LABEL,
  formatMonthlyAmount,
  isMembershipConfigured,
  isPayActionable,
  paymentDisplayMeta,
} from "@/lib/domain/payments";
import { DISCIPLINE_META } from "@/lib/domain/discipline";
import {
  ATHLETE_SEX_LABEL,
  EXPERIENCE_LEVEL_LABEL,
  hasAnyThreshold,
  relevantThresholdFields,
} from "@/lib/domain/athlete-profile";
import { AthleteAvatar } from "@/components/athletes/AthleteAvatar";
import { DisciplineChip } from "@/components/athletes/DisciplineChip";
import { AccessStatusPill } from "@/components/athletes/AccessStatusPill";
import { InviteAccessControl } from "@/components/athletes/InviteAccessControl";
import { EditAthleteDialog } from "@/components/athletes/EditAthleteDialog";
import { EditGoalDialog } from "@/components/athletes/EditGoalDialog";
import { EditMembershipDialog } from "@/components/athletes/EditMembershipDialog";
import { EditSportProfileDialog } from "@/components/athletes/EditSportProfileDialog";
import { AddRecordDialog } from "@/components/athletes/AddRecordDialog";
import { Sparkline } from "@/components/athletes/Sparkline";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const coachId = await getCurrentCoachId();
  const detail = await getAthleteDetail(id, coachId);
  return { title: detail ? `${detail.athlete.fullName} · Umbral Training` : "Atleta · Umbral Training" };
}

export default async function AtletaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coachId = await getCurrentCoachId();
  const detail = await getAthleteDetail(id, coachId);
  if (!detail) notFound();

  const { athlete, records, activeGoal, membership, assignedWorkouts } = detail;
  const raceDefined = isRaceGoalDefined(activeGoal);
  const payConfigured = isMembershipConfigured(membership);
  const payMeta = paymentDisplayMeta(membership.currentPeriodStatus, payConfigured);
  const objectiveSummary = goalSummaryLabel(activeGoal);

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/athletes"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors hover:text-[var(--coral)]"
        style={{ color: "var(--text-2)" }}
      >
        <ChevronLeft size={16} /> Atletas
      </Link>

      {/* ---------------- header ---------------- */}
      <div
        className="flex flex-wrap items-center gap-[18px] rounded-[18px] border p-[22px] shadow-[var(--shadow)]"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <AthleteAvatar fullName={athlete.fullName} color={athlete.avatarColor} size={66} radius={18} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="m-0 text-2xl font-extrabold tracking-[-.5px]">{athlete.fullName}</h1>
            <span
              className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold"
              style={{ background: payMeta.bg, color: payMeta.colorVar }}
            >
              {payMeta.label}
            </span>
            <AccessStatusPill status={athlete.accessStatus} />
          </div>
          <div className="mt-1 text-[13.5px]" style={{ color: "var(--text-2)" }}>
            {athlete.email ?? "Sin email"}
            {athlete.phone && ` · ${athlete.phone}`} · {objectiveSummary}
          </div>
          {(athlete.birthDate || athlete.sex) && (
            <div className="mt-0.5 text-[12.5px]" style={{ color: "var(--text-3)" }}>
              {athlete.birthDate && formatDateEs(athlete.birthDate)}
              {athlete.birthDate && athlete.sex && " · "}
              {athlete.sex && ATHLETE_SEX_LABEL[athlete.sex]}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              {athlete.disciplines.map((d) => (
                <DisciplineChip key={d} discipline={d} />
              ))}
            </div>
            <InviteAccessControl
              athleteId={athlete.id}
              status={athlete.accessStatus}
              email={athlete.email}
              variant="detail"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <EditAthleteDialog athlete={athlete} />
          <Link
            href="/"
            className="flex h-[42px] items-center gap-[7px] rounded-[10px] px-[18px] text-[13.5px] font-bold text-white shadow-[var(--shadow)]"
            style={{ background: "var(--coral)" }}
          >
            <Plus size={16} /> Asignar entreno
          </Link>
        </div>
      </div>

      {/* ---------------- 2-column grid ---------------- */}
      <div className="grid items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex min-w-0 flex-col gap-4">
          {/* marcas de carrera */}
          <div
            className="rounded-[18px] border p-[22px] shadow-[var(--shadow)]"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <div className="text-base font-bold">Marcas de carrera</div>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: "var(--text-3)" }}>
                  ritmo min/km derivado
                </span>
                <AddRecordDialog athleteId={athlete.id} />
              </div>
            </div>
            <div className="flex flex-col">
              {RACE_REFERENCES.map((ref) => {
                const record = latestRecordFor(records, ref);
                const history = historyFor(records, ref).map((r) => r.timeSeconds);
                return (
                  <div
                    key={ref}
                    className="flex items-center gap-4 border-b py-3.5 last:border-b-0"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="w-11 text-sm font-extrabold" style={{ color: "var(--text-2)" }}>
                      {ref.toUpperCase()}
                    </div>
                    {record ? (
                      <>
                        <div className="min-w-[82px]">
                          <div className="text-lg font-bold tabular-nums">
                            {formatDuration(record.timeSeconds)}
                          </div>
                          <div className="text-[11.5px]" style={{ color: "var(--text-2)" }}>
                            {formatDateEs(record.recordedOn)}
                          </div>
                        </div>
                        <div className="text-[12.5px] tabular-nums" style={{ color: "var(--text-2)" }}>
                          {formatPacePerKm(computePaceSecondsPerKm(record.timeSeconds, ref))}
                        </div>
                        <div className="ml-auto hidden shrink-0 sm:block">
                          <Sparkline values={history} color={DISCIPLINE_META.run.colorVar} />
                        </div>
                      </>
                    ) : (
                      <div className="text-[13.5px] italic" style={{ color: "var(--text-3)" }}>
                        Sin registro
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* entrenos asignados */}
          <div
            className="rounded-[18px] border p-[22px] shadow-[var(--shadow)]"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-base font-bold">Entrenos asignados</div>
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-[13px] font-semibold"
                style={{ color: "var(--text)" }}
              >
                Abrir constructor <ChevronRight size={14} />
              </Link>
            </div>
            {assignedWorkouts.length === 0 ? (
              <p className="py-2 text-[13.5px] italic" style={{ color: "var(--text-3)" }}>
                Sin entrenos asignados todavía.
              </p>
            ) : (
              assignedWorkouts.map((w) => (
                <div
                  key={w.id}
                  className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-b py-3 last:border-b-0"
                  style={{ borderColor: "var(--border)" }}
                >
                  <DisciplineChip discipline={w.discipline} />
                  <span className="truncate text-[13.5px] font-semibold">{w.name}</span>
                  <span className="text-[12.5px] tabular-nums whitespace-nowrap" style={{ color: "var(--text-2)" }}>
                    {formatDateEs(w.scheduledDate)}
                  </span>
                  <Link href="/" className="text-[12.5px] font-bold" style={{ color: "var(--coral)" }}>
                    PDF
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* objetivo */}
          <div
            className="rounded-[18px] border p-5 shadow-[var(--shadow)]"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="mb-3.5 flex items-center justify-between">
              <div className="text-base font-bold">Objetivo</div>
              <div className="flex items-center gap-1.5">
                <Target size={18} style={{ color: "var(--text-3)" }} />
                {raceDefined && (
                  <EditGoalDialog athleteId={athlete.id} goal={activeGoal} defined />
                )}
              </div>
            </div>
            {raceDefined && activeGoal ? (
              <>
                <div className="mb-4 flex items-center gap-[13px]">
                  <div
                    className="flex size-11 flex-none items-center justify-center rounded-xl"
                    style={{ background: "var(--coral-tint)", color: "var(--coral)" }}
                  >
                    <Flag size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold">{activeGoal.raceName}</div>
                    <div className="text-[12.5px]" style={{ color: "var(--text-2)" }}>
                      {activeGoal.format} · {activeGoal.raceDate && formatDateEs(activeGoal.raceDate)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 rounded-xl p-3.5 text-center" style={{ background: "var(--coral-tint)" }}>
                    <div className="text-[26px] font-extrabold tabular-nums" style={{ color: "var(--coral)" }}>
                      {goalDaysRemaining(activeGoal)}
                    </div>
                    <div className="mt-0.5 text-[11.5px]" style={{ color: "var(--text-2)" }}>
                      días restantes
                    </div>
                  </div>
                  <div className="flex-1 rounded-xl p-3.5 text-center" style={{ background: "var(--surface-2)" }}>
                    <div className="text-[26px] font-extrabold tabular-nums">
                      {formatGoalPace(activeGoal)}
                    </div>
                    <div className="mt-0.5 text-[11.5px]" style={{ color: "var(--text-2)" }}>
                      ritmo objetivo
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3.5">
                <div
                  className="flex items-center gap-3 rounded-xl p-3.5"
                  style={{ background: "var(--surface-2)" }}
                >
                  <div
                    className="flex size-10 flex-none items-center justify-center rounded-[11px]"
                    style={{ background: "var(--surface-3)", color: "var(--text-2)" }}
                  >
                    {isRaceGoal(activeGoal) ? <Flag size={18} /> : <Target size={18} />}
                  </div>
                  <div>
                    <div className="text-sm font-bold">
                      {isRaceGoal(activeGoal) ? "Carrera sin definir" : "Mantenimiento"}
                    </div>
                    <div className="text-[12.5px]" style={{ color: "var(--text-2)" }}>
                      {isRaceGoal(activeGoal)
                        ? "Falta la carrera y su fecha"
                        : "Sin carrera objetivo activa"}
                    </div>
                  </div>
                </div>
                <EditGoalDialog athleteId={athlete.id} goal={activeGoal} defined={false} />
              </div>
            )}
          </div>

          {/* membresía */}
          <div
            className="rounded-[18px] border p-5 shadow-[var(--shadow)]"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="mb-3.5 flex items-center justify-between">
              <div className="text-base font-bold">Membresía</div>
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold"
                  style={{ background: payMeta.bg, color: payMeta.colorVar }}
                >
                  {payMeta.label}
                </span>
                {payConfigured && (
                  <EditMembershipDialog
                    athleteId={athlete.id}
                    membership={membership}
                    configured
                  />
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
                  Modo
                </span>
                <span className="text-[13.5px] font-bold">{MEMBERSHIP_MODE_LABEL[membership.mode]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
                  Monto mensual
                </span>
                <span className="text-[13.5px] font-bold tabular-nums">
                  {formatMonthlyAmount(membership)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
                  Periodo actual
                </span>
                <span className="text-[13.5px] font-bold">{membership.currentPeriodLabel}</span>
              </div>
            </div>
            {!payConfigured && (
              <div className="mt-4 flex flex-col gap-2.5">
                <p className="text-[12.5px]" style={{ color: "var(--text-2)" }}>
                  Aún no has acordado una cuota con este atleta.
                </p>
                <EditMembershipDialog
                  athleteId={athlete.id}
                  membership={membership}
                  configured={false}
                />
              </div>
            )}
            {isPayActionable(membership) && (
              <form action={markPeriodPaidAction.bind(null, athlete.id)}>
                <button
                  type="submit"
                  className="mt-4 flex h-[42px] w-full items-center justify-center gap-2 rounded-[10px] text-[13.5px] font-bold text-white"
                  style={{ background: "var(--coral)" }}
                >
                  <Check size={16} /> Marcar como pagado
                </button>
              </form>
            )}
          </div>

          {/* perfil deportivo */}
          <div
            className="rounded-[18px] border p-5 shadow-[var(--shadow)]"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="mb-3.5 flex items-center justify-between">
              <div className="text-base font-bold">Perfil deportivo</div>
              <div className="flex items-center gap-1.5">
                <Activity size={18} style={{ color: "var(--text-3)" }} />
                <EditSportProfileDialog athlete={athlete} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
                  Nivel
                </span>
                <span className="text-[13.5px] font-bold">
                  {athlete.level ? EXPERIENCE_LEVEL_LABEL[athlete.level] : "Sin definir"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
                  Disponibilidad
                </span>
                <span className="text-[13.5px] font-bold">
                  {athlete.weeklyAvailabilityDays || athlete.weeklyAvailabilityHours
                    ? [
                        athlete.weeklyAvailabilityDays && `${athlete.weeklyAvailabilityDays} días`,
                        athlete.weeklyAvailabilityHours && `${athlete.weeklyAvailabilityHours} h`,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : "Sin definir"}
                </span>
              </div>

              {hasAnyThreshold(athlete.thresholds) && (
                <>
                  <div className="my-0.5 h-px" style={{ background: "var(--border)" }} />
                  {relevantThresholdFields(athlete.disciplines).run &&
                    athlete.thresholds?.runThresholdPaceSecPerKm && (
                      <div className="flex items-center justify-between">
                        <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
                          Ritmo umbral
                        </span>
                        <span className="text-[13.5px] font-bold tabular-nums">
                          {formatPacePerKm(athlete.thresholds.runThresholdPaceSecPerKm)}
                        </span>
                      </div>
                    )}
                  {relevantThresholdFields(athlete.disciplines).bike &&
                    athlete.thresholds?.bikeFtpWatts && (
                      <div className="flex items-center justify-between">
                        <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
                          FTP
                        </span>
                        <span className="text-[13.5px] font-bold tabular-nums">
                          {athlete.thresholds.bikeFtpWatts} W
                        </span>
                      </div>
                    )}
                  {relevantThresholdFields(athlete.disciplines).swim &&
                    athlete.thresholds?.swimThresholdPaceSecPer100m && (
                      <div className="flex items-center justify-between">
                        <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
                          CSS
                        </span>
                        <span className="text-[13.5px] font-bold tabular-nums">
                          {formatDuration(athlete.thresholds.swimThresholdPaceSecPer100m)} /100m
                        </span>
                      </div>
                    )}
                  {athlete.thresholds?.maxHr && (
                    <div className="flex items-center justify-between">
                      <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
                        FC máx · reposo
                      </span>
                      <span className="text-[13.5px] font-bold tabular-nums">
                        {athlete.thresholds.maxHr}
                        {athlete.thresholds.restHr && ` · ${athlete.thresholds.restHr}`}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
