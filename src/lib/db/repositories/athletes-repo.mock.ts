import type {
  Athlete,
  AthleteDetail,
  AssignedWorkout,
  Goal,
  Membership,
  RaceRecord,
} from "@/lib/domain/types";
import type { AthleteRepository, GoalInput } from "@/lib/domain/repositories";
import { DISCIPLINE_META } from "@/lib/domain/discipline";

/** Race detail only ever applies to a `race` goal — switching to maintenance drops it. */
function goalDetailFrom(input: GoalInput) {
  return input.type === "race"
    ? {
        raceName: input.raceName,
        raceDate: input.raceDate,
        modality: input.modality,
        format: input.format as Goal["format"],
        targetPaceSecPerKm: input.targetPaceSecPerKm,
      }
    : {
        raceName: undefined,
        raceDate: undefined,
        modality: undefined,
        format: undefined,
        targetPaceSecPerKm: undefined,
      };
}

/**
 * In-memory stand-in for the athletes table + its related tables until the
 * Supabase schema (docs/PRD.md §6) exists. Same shape the coach sees today;
 * swapping this for a Drizzle-backed repository later is a drop-in change —
 * services and routes only ever depend on AthleteRepository.
 */
export const MOCK_COACH_ID = "coach-laura-mendez";

const athletes: Athlete[] = [
  { id: "ath-1", coachId: MOCK_COACH_ID, fullName: "Marta Ríos", email: "marta.rios@gmail.com", phone: "+34 611 222 333", birthDate: "1992-04-18", sex: "female", status: "active", accessStatus: "linked", disciplines: ["run"], level: "advanced", weeklyAvailabilityDays: 5, weeklyAvailabilityHours: 7, thresholds: { runThresholdPaceSecPerKm: 4 * 60 + 20, maxHr: 188, restHr: 48 }, avatarColor: "var(--coral)", createdAt: "2026-02-10" },
  { id: "ath-2", coachId: MOCK_COACH_ID, fullName: "Elena Prat", email: "elena.prat@gmail.com", phone: "+34 622 333 444", birthDate: "1988-11-02", sex: "female", status: "active", accessStatus: "linked", disciplines: ["swim", "bike", "run"], level: "intermediate", weeklyAvailabilityDays: 6, weeklyAvailabilityHours: 9, thresholds: { runThresholdPaceSecPerKm: 4 * 60 + 50, bikeFtpWatts: 210, swimThresholdPaceSecPer100m: 95, maxHr: 182, restHr: 52 }, avatarColor: "var(--bike)", createdAt: "2026-01-22" },
  { id: "ath-3", coachId: MOCK_COACH_ID, fullName: "Diego Sanz", email: "diego.sanz@gmail.com", status: "active", accessStatus: "invited", disciplines: ["swim", "bike", "run"], avatarColor: "var(--swim)", createdAt: "2026-03-05" },
  { id: "ath-4", coachId: MOCK_COACH_ID, fullName: "Iván Costa", email: "ivan.costa@gmail.com", status: "active", accessStatus: "draft", disciplines: ["gym"], avatarColor: "var(--gym)", createdAt: "2026-04-01" },
  { id: "ath-5", coachId: MOCK_COACH_ID, fullName: "Nora Vega", status: "active", accessStatus: "draft", disciplines: ["run"], avatarColor: "var(--coral)", createdAt: "2026-02-28" },
  { id: "ath-6", coachId: MOCK_COACH_ID, fullName: "Sofía Blanco", email: "sofia.blanco@gmail.com", status: "active", accessStatus: "invited", disciplines: ["run", "swim"], avatarColor: "var(--coral)", createdAt: "2026-05-12" },
  { id: "ath-7", coachId: MOCK_COACH_ID, fullName: "Pablo Duarte", email: "pablo.duarte@gmail.com", status: "active", accessStatus: "linked", disciplines: ["bike", "run"], avatarColor: "var(--bike)", createdAt: "2026-03-19" },
  { id: "ath-8", coachId: MOCK_COACH_ID, fullName: "Carla Ibáñez", email: "carla.ibanez@gmail.com", status: "active", accessStatus: "draft", disciplines: ["gym", "run"], avatarColor: "var(--gym)", createdAt: "2026-04-22" },
];

const records: RaceRecord[] = [
  { id: "rec-1", athleteId: "ath-1", reference: "5k", timeSeconds: 22 * 60 + 10, recordedOn: "2026-03-01" },
  { id: "rec-2", athleteId: "ath-1", reference: "5k", timeSeconds: 21 * 60 + 30, recordedOn: "2026-06-01" },
  { id: "rec-3", athleteId: "ath-1", reference: "10k", timeSeconds: 44 * 60 + 50, recordedOn: "2026-06-15" },
  { id: "rec-4", athleteId: "ath-1", reference: "21k", timeSeconds: 3600 + 38 * 60 + 20, recordedOn: "2026-07-20" },

  { id: "rec-5", athleteId: "ath-2", reference: "5k", timeSeconds: 23 * 60 + 40, recordedOn: "2026-05-10" },
  { id: "rec-6", athleteId: "ath-2", reference: "10k", timeSeconds: 49 * 60 + 10, recordedOn: "2026-06-02" },

  { id: "rec-7", athleteId: "ath-3", reference: "5k", timeSeconds: 24 * 60 + 50, recordedOn: "2026-04-18" },

  { id: "rec-8", athleteId: "ath-5", reference: "1k", timeSeconds: 3 * 60 + 55, recordedOn: "2026-05-01" },
  { id: "rec-9", athleteId: "ath-5", reference: "5k", timeSeconds: 21 * 60 + 50, recordedOn: "2026-05-01" },
  { id: "rec-10", athleteId: "ath-5", reference: "5k", timeSeconds: 21 * 60 + 10, recordedOn: "2026-07-01" },
  { id: "rec-11", athleteId: "ath-5", reference: "10k", timeSeconds: 45 * 60 + 30, recordedOn: "2026-06-10" },

  { id: "rec-12", athleteId: "ath-6", reference: "5k", timeSeconds: 20 * 60 + 45, recordedOn: "2026-06-20" },
  { id: "rec-13", athleteId: "ath-6", reference: "10k", timeSeconds: 44 * 60, recordedOn: "2026-05-01" },
  { id: "rec-14", athleteId: "ath-6", reference: "10k", timeSeconds: 43 * 60 + 10, recordedOn: "2026-07-25" },

  { id: "rec-15", athleteId: "ath-7", reference: "10k", timeSeconds: 47 * 60, recordedOn: "2026-05-15" },

  { id: "rec-16", athleteId: "ath-8", reference: "5k", timeSeconds: 26 * 60, recordedOn: "2026-04-01" },
];

const goals: Goal[] = [
  { id: "goal-1", athleteId: "ath-1", type: "race", raceName: "Maratón de Valencia", raceDate: "2026-09-19", modality: "running", format: "42k", targetPaceSecPerKm: 4 * 60 + 45, status: "active" },
  { id: "goal-2", athleteId: "ath-2", type: "race", raceName: "IM 70.3 Marbella", raceDate: "2026-10-03", modality: "triathlon", format: "70.3", status: "active" },
  { id: "goal-3", athleteId: "ath-3", type: "race", raceName: "Triatlón Sprint Costa Brava", raceDate: "2026-08-31", modality: "triathlon", format: "sprint", status: "active" },
  { id: "goal-4", athleteId: "ath-4", type: "maintenance", status: "active" },
  { id: "goal-5", athleteId: "ath-5", type: "maintenance", status: "active" },
  { id: "goal-6", athleteId: "ath-6", type: "race", raceName: "10K Popular de Otoño", raceDate: "2026-08-24", modality: "running", format: "10k", targetPaceSecPerKm: 4 * 60 + 10, status: "active" },
  { id: "goal-7", athleteId: "ath-7", type: "race", raceName: "Triatlón Olímpico Banyoles", raceDate: "2026-10-16", modality: "triathlon", format: "olympic", status: "active" },
  { id: "goal-8", athleteId: "ath-8", type: "maintenance", status: "active" },
];

const memberships: Record<string, Membership> = {
  "ath-1": { id: "mem-1", athleteId: "ath-1", mode: "manual", amount: 45, currency: "$", currentPeriodLabel: "Agosto 2026", currentPeriodStatus: "paid", paidOn: "2026-08-02" },
  "ath-2": { id: "mem-2", athleteId: "ath-2", mode: "manual", amount: 60, currency: "$", currentPeriodLabel: "Agosto 2026", currentPeriodStatus: "paid", paidOn: "2026-08-01" },
  "ath-3": { id: "mem-3", athleteId: "ath-3", mode: "manual", amount: 45, currency: "$", currentPeriodLabel: "Agosto 2026", currentPeriodStatus: "pending" },
  "ath-4": { id: "mem-4", athleteId: "ath-4", mode: "free", currency: "$", currentPeriodLabel: "Agosto 2026", currentPeriodStatus: "waived" },
  "ath-5": { id: "mem-5", athleteId: "ath-5", mode: "manual", amount: 40, currency: "$", currentPeriodLabel: "Julio 2026", currentPeriodStatus: "overdue" },
  "ath-6": { id: "mem-6", athleteId: "ath-6", mode: "manual", amount: 45, currency: "$", currentPeriodLabel: "Agosto 2026", currentPeriodStatus: "pending" },
  "ath-7": { id: "mem-7", athleteId: "ath-7", mode: "gateway", amount: 55, currency: "$", currentPeriodLabel: "Agosto 2026", currentPeriodStatus: "pending" },
  "ath-8": { id: "mem-8", athleteId: "ath-8", mode: "manual", amount: 40, currency: "$", currentPeriodLabel: "Agosto 2026", currentPeriodStatus: "paid", paidOn: "2026-08-03" },
};

const assignedWorkouts: AssignedWorkout[] = [
  { id: "wk-1", athleteId: "ath-1", discipline: "run", name: "Series 8×400", scheduledDate: "2026-08-13" },
  { id: "wk-2", athleteId: "ath-1", discipline: "run", name: "Rodaje largo", scheduledDate: "2026-08-16" },
  { id: "wk-3", athleteId: "ath-2", discipline: "bike", name: "Umbral 3×10", scheduledDate: "2026-08-14" },
  { id: "wk-4", athleteId: "ath-2", discipline: "swim", name: "Técnica 100", scheduledDate: "2026-08-15" },
  { id: "wk-5", athleteId: "ath-3", discipline: "swim", name: "Aguas abiertas 3k", scheduledDate: "2026-08-14" },
  { id: "wk-6", athleteId: "ath-4", discipline: "gym", name: "Fuerza inferior", scheduledDate: "2026-08-13" },
  { id: "wk-7", athleteId: "ath-5", discipline: "run", name: "Rodaje suave", scheduledDate: "2026-08-15" },
  { id: "wk-8", athleteId: "ath-6", discipline: "run", name: "Series 400", scheduledDate: "2026-08-13" },
  { id: "wk-9", athleteId: "ath-7", discipline: "bike", name: "Series en llano", scheduledDate: "2026-08-16" },
  { id: "wk-10", athleteId: "ath-8", discipline: "gym", name: "Fuerza superior", scheduledDate: "2026-08-14" },
];

let nextId = athletes.length + 1;

function activeGoalOf(athleteId: string): Goal | null {
  return goals.find((g) => g.athleteId === athleteId && g.status === "active") ?? null;
}

/** Every mutation is scoped by coach — a miss is either a bad id or another coach's athlete. */
function requireAthlete(athleteId: string, coachId: string): Athlete {
  const athlete = athletes.find((a) => a.id === athleteId && a.coachId === coachId);
  if (!athlete) throw new Error("Atleta no encontrado");
  return athlete;
}

export const mockAthleteRepository: AthleteRepository = {
  async listByCoach(coachId) {
    return athletes.filter((a) => a.coachId === coachId && a.status === "active");
  },

  async listDetailsByCoach(coachId) {
    return athletes
      .filter((a) => a.coachId === coachId && a.status === "active")
      .map((athlete) => ({
        athlete,
        records: records.filter((r) => r.athleteId === athlete.id),
        activeGoal: activeGoalOf(athlete.id),
        membership: memberships[athlete.id],
        assignedWorkouts: assignedWorkouts.filter((w) => w.athleteId === athlete.id),
      }));
  },

  async getDetail(athleteId, coachId) {
    const athlete = athletes.find((a) => a.id === athleteId && a.coachId === coachId);
    if (!athlete) return null;
    const membership = memberships[athleteId];
    const detail: AthleteDetail = {
      athlete,
      records: records.filter((r) => r.athleteId === athleteId),
      activeGoal: activeGoalOf(athleteId),
      membership,
      assignedWorkouts: assignedWorkouts.filter((w) => w.athleteId === athleteId),
    };
    return detail;
  },

  async createAthlete(coachId, input) {
    const athlete: Athlete = {
      id: `ath-${nextId++}`,
      coachId,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      birthDate: input.birthDate,
      sex: input.sex,
      status: "active",
      accessStatus: input.sendInviteNow && input.email ? "invited" : "draft",
      disciplines: input.disciplines,
      level: input.level,
      weeklyAvailabilityDays: input.weeklyAvailabilityDays,
      weeklyAvailabilityHours: input.weeklyAvailabilityHours,
      thresholds: input.thresholds,
      avatarColor: input.disciplines[0] ? DISCIPLINE_META[input.disciplines[0]].colorVar : "var(--coral)",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    athletes.push(athlete);
    goals.push({
      id: `goal-${athlete.id}`,
      athleteId: athlete.id,
      type: input.goal.type,
      status: "active",
      ...goalDetailFrom(input.goal),
    });
    memberships[athlete.id] = {
      id: `mem-${athlete.id}`,
      athleteId: athlete.id,
      mode: "manual",
      currency: "$",
      currentPeriodLabel: "Agosto 2026",
      currentPeriodStatus: "pending",
    };
    return athlete;
  },

  async sendInvite(athleteId, coachId, email) {
    const athlete = requireAthlete(athleteId, coachId);
    if (email) athlete.email = email;
    if (!athlete.email) throw new Error("Este atleta necesita un email para poder invitarlo.");
    athlete.accessStatus = "invited";
    return athlete;
  },

  async cancelInvite(athleteId, coachId) {
    const athlete = requireAthlete(athleteId, coachId);
    athlete.accessStatus = "draft";
    return athlete;
  },

  async updateAthlete(athleteId, coachId, input) {
    const athlete = requireAthlete(athleteId, coachId);
    athlete.fullName = input.fullName;
    athlete.email = input.email;
    athlete.phone = input.phone;
    athlete.birthDate = input.birthDate;
    athlete.sex = input.sex;
    return athlete;
  },

  async updateSportProfile(athleteId, coachId, input) {
    const athlete = requireAthlete(athleteId, coachId);
    athlete.disciplines = input.disciplines;
    athlete.level = input.level;
    athlete.weeklyAvailabilityDays = input.weeklyAvailabilityDays;
    athlete.weeklyAvailabilityHours = input.weeklyAvailabilityHours;
    athlete.thresholds = input.thresholds;
    if (input.disciplines[0]) {
      athlete.avatarColor = DISCIPLINE_META[input.disciplines[0]].colorVar;
    }
    return athlete;
  },

  async upsertActiveGoal(athleteId, coachId, input) {
    requireAthlete(athleteId, coachId);
    const existing = goals.find((g) => g.athleteId === athleteId && g.status === "active");
    const detail = goalDetailFrom(input);

    if (existing) {
      Object.assign(existing, { type: input.type, ...detail });
      return existing;
    }

    const goal: Goal = {
      id: `goal-${athleteId}-${nextId++}`,
      athleteId,
      type: input.type,
      status: "active",
      ...detail,
    };
    goals.push(goal);
    return goal;
  },

  async updateMembership(athleteId, coachId, input) {
    requireAthlete(athleteId, coachId);
    const membership = memberships[athleteId];
    membership.mode = input.mode;
    membership.amount = input.mode === "free" ? undefined : input.amount;
    membership.currency = input.currency;
    // A free plan has nothing to collect; a plan that turns paid starts owing
    // the current period unless it was already settled.
    if (input.mode === "free") {
      membership.currentPeriodStatus = "waived";
    } else if (membership.currentPeriodStatus === "waived") {
      membership.currentPeriodStatus = "pending";
    }
    return membership;
  },

  async addRaceRecord(athleteId, coachId, input) {
    requireAthlete(athleteId, coachId);
    const record: RaceRecord = {
      id: `rec-${athleteId}-${nextId++}`,
      athleteId,
      reference: input.reference,
      timeSeconds: input.timeSeconds,
      recordedOn: input.recordedOn,
      note: input.note,
    };
    records.push(record);
    return record;
  },

  async markCurrentPeriodPaid(athleteId, coachId, input) {
    requireAthlete(athleteId, coachId);
    const membership = memberships[athleteId];
    membership.currentPeriodStatus = "paid";
    membership.paidOn = new Date().toISOString().slice(0, 10);
    membership.lastPaymentNote = input.note;
  },
};
