import type { RaceReference } from "@/lib/domain/types";
import type { WorkoutRepository } from "@/lib/domain/repositories";
import type {
  AthletePaces,
  PlanChange,
  ResolvedPace,
  TrainingGroup,
  WeekPlan,
  WorkoutSession,
} from "@/lib/domain/workouts";
import { DAYS_PER_WEEK, planSessions, sessionRelativeSteps, stepKey } from "@/lib/domain/workouts";
import { addDaysISO, mondayOfISO, toISODate } from "@/lib/domain/time";

/** The mock's own coach; the re-keyed wrapper (workouts-repo.rekeyed.ts) maps the signed-in coach onto it. */
export const MOCK_COACH_ID = "coach-laura-mendez";

/** Mock athletes, in the order they map onto the coach's real athletes. */
export const MOCK_ATHLETE_IDS = ["ath-1", "ath-2", "ath-3", "ath-4", "ath-5", "ath-6", "ath-7", "ath-8"];

/**
 * In-memory stand-in for the backend's plans API. Paces are NOT computed
 * here: PACE_FIXTURES is shaped like the backend's answer, precomputed
 * offline from the athletes mock's latest records ("add %" formula, Riegel
 * for missing distances, rounded to 5 s). It only covers the intensities
 * used by the session library below.
 */

/* ------------------------------------------------------------------ */
/*  Session library                                                    */
/* ------------------------------------------------------------------ */

const library: WorkoutSession[] = [
  {
    id: "lib-series-400",
    name: "Series 400",
    discipline: "run",
    nodes: [
      { type: "step", id: "warmup", kind: "warmup", duration: { kind: "time", seconds: 900 }, target: { kind: "feel", label: "Suave" } },
      {
        type: "repeat",
        id: "main",
        times: 10,
        steps: [
          { type: "step", id: "work", kind: "work", duration: { kind: "distance", meters: 400 }, target: { kind: "relative", reference: "1k", percent: 85 } },
          { type: "step", id: "rec", kind: "recovery", duration: { kind: "time", seconds: 60 }, target: { kind: "feel", label: "Trote" } },
        ],
      },
      { type: "step", id: "cooldown", kind: "cooldown", duration: { kind: "time", seconds: 600 }, target: { kind: "feel", label: "Suave" } },
    ],
  },
  {
    id: "lib-series-1k",
    name: "Series 6×1k",
    discipline: "run",
    nodes: [
      { type: "step", id: "warmup", kind: "warmup", duration: { kind: "time", seconds: 900 }, target: { kind: "feel", label: "Suave" } },
      {
        type: "repeat",
        id: "main",
        times: 6,
        steps: [
          { type: "step", id: "work", kind: "work", duration: { kind: "distance", meters: 1000 }, target: { kind: "relative", reference: "5k", percent: 95 } },
          { type: "step", id: "rec", kind: "recovery", duration: { kind: "time", seconds: 120 }, target: { kind: "feel", label: "Trote" } },
        ],
      },
      { type: "step", id: "cooldown", kind: "cooldown", duration: { kind: "time", seconds: 600 }, target: { kind: "feel", label: "Suave" } },
    ],
  },
  {
    id: "lib-tempo",
    name: "Tempo 3×10'",
    discipline: "run",
    nodes: [
      { type: "step", id: "warmup", kind: "warmup", duration: { kind: "time", seconds: 900 }, target: { kind: "feel", label: "Suave" } },
      {
        type: "repeat",
        id: "main",
        times: 3,
        steps: [
          { type: "step", id: "work", kind: "work", duration: { kind: "time", seconds: 600 }, target: { kind: "relative", reference: "10k", percent: 90 } },
          { type: "step", id: "rec", kind: "recovery", duration: { kind: "time", seconds: 180 }, target: { kind: "feel", label: "Trote" } },
        ],
      },
      { type: "step", id: "cooldown", kind: "cooldown", duration: { kind: "time", seconds: 600 }, target: { kind: "feel", label: "Suave" } },
    ],
  },
  {
    id: "lib-long-run",
    name: "Rodaje largo",
    discipline: "run",
    nodes: [
      { type: "step", id: "work", kind: "work", duration: { kind: "distance", meters: 16000 }, target: { kind: "relative", reference: "21k", percent: 80 } },
    ],
  },
  {
    id: "lib-easy-run",
    name: "Rodaje suave",
    discipline: "run",
    nodes: [
      { type: "step", id: "work", kind: "work", duration: { kind: "time", seconds: 2700 }, target: { kind: "feel", label: "Suave · RPE 3" } },
    ],
  },
  {
    id: "lib-swim-tech",
    name: "Técnica 100",
    discipline: "swim",
    nodes: [
      { type: "step", id: "warmup", kind: "warmup", duration: { kind: "distance", meters: 400 }, target: { kind: "feel", label: "Suave" } },
      {
        type: "repeat",
        id: "main",
        times: 10,
        steps: [
          { type: "step", id: "work", kind: "work", duration: { kind: "distance", meters: 100 }, target: { kind: "feel", label: "RPE 7" } },
          { type: "step", id: "rec", kind: "recovery", duration: { kind: "time", seconds: 20 }, target: { kind: "feel", label: "Pausa" } },
        ],
      },
      { type: "step", id: "cooldown", kind: "cooldown", duration: { kind: "distance", meters: 200 }, target: { kind: "feel", label: "Suave" } },
    ],
  },
  {
    id: "lib-bike-z2",
    name: "Bici Z2",
    discipline: "bike",
    nodes: [
      { type: "step", id: "work", kind: "work", duration: { kind: "time", seconds: 5400 }, target: { kind: "feel", label: "Z2 · conversacional" } },
    ],
  },
  {
    id: "lib-strength",
    name: "Fuerza general",
    discipline: "gym",
    nodes: [
      { type: "step", id: "work", kind: "work", duration: { kind: "time", seconds: 2700 }, target: { kind: "feel", label: "Circuito de fuerza" } },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Backend fixtures                                                   */
/* ------------------------------------------------------------------ */

const p = (paceSecPerKm: number, estimated = false): ResolvedPace => ({ paceSecPerKm, estimated });

const REFERENCE_PACES: Record<string, Record<RaceReference, ResolvedPace>> = {
  "ath-1": { "1k": p(234, true), "5k": p(258), "10k": p(269), "21k": p(280) },
  "ath-2": { "1k": p(258, true), "5k": p(284), "10k": p(295), "21k": p(309, true) },
  "ath-3": { "1k": p(271, true), "5k": p(298), "10k": p(311, true), "21k": p(325, true) },
  "ath-5": { "1k": p(235), "5k": p(254), "10k": p(273), "21k": p(286, true) },
  "ath-6": { "1k": p(226, true), "5k": p(249), "10k": p(259), "21k": p(271, true) },
  "ath-7": { "1k": p(246, true), "5k": p(271, true), "10k": p(282), "21k": p(295, true) },
  "ath-8": { "1k": p(283, true), "5k": p(312), "10k": p(325, true), "21k": p(340, true) },
};

/** Resolved pace per athlete for each "reference@percent" the library uses. */
const PACE_FIXTURES: Record<string, Record<string, ResolvedPace>> = {
  "ath-1": { "1k@85": p(270, true), "5k@95": p(270), "10k@90": p(295), "21k@80": p(335) },
  "ath-2": { "1k@85": p(295, true), "5k@95": p(300), "10k@90": p(325), "21k@80": p(370, true) },
  "ath-3": { "1k@85": p(310, true), "5k@95": p(315), "10k@90": p(340, true), "21k@80": p(390, true) },
  "ath-5": { "1k@85": p(270), "5k@95": p(265), "10k@90": p(300), "21k@80": p(345, true) },
  "ath-6": { "1k@85": p(260, true), "5k@95": p(260), "10k@90": p(285), "21k@80": p(325, true) },
  "ath-7": { "1k@85": p(285, true), "5k@95": p(285, true), "10k@90": p(310), "21k@80": p(355, true) },
  "ath-8": { "1k@85": p(325, true), "5k@95": p(330), "10k@90": p(360, true), "21k@80": p(410, true) },
};

/* ------------------------------------------------------------------ */
/*  Groups and seeded weeks                                            */
/* ------------------------------------------------------------------ */

const groups: TrainingGroup[] = [
  { id: "grp-long", coachId: MOCK_COACH_ID, name: "Fondo · 21k y maratón", athleteIds: ["ath-1", "ath-5"] },
  { id: "grp-speed", coachId: MOCK_COACH_ID, name: "Velocidad · 5k y 10k", athleteIds: ["ath-6", "ath-8"] },
  { id: "grp-tri", coachId: MOCK_COACH_ID, name: "Triatlón", athleteIds: ["ath-2", "ath-3", "ath-7"] },
];

let nextId = 1;
const newId = (prefix: string) => `${prefix}-${nextId++}`;

function instance(librarySessionId: string): WorkoutSession {
  const source = library.find((s) => s.id === librarySessionId);
  if (!source) throw new Error("Entreno no encontrado");
  return { ...structuredClone(source), id: newId("ses") };
}

/** Sessions per day by library id, Monday first. */
const WEEK_LAYOUTS: Record<string, string[][]> = {
  "grp-long": [["lib-easy-run"], ["lib-series-400"], [], ["lib-tempo"], ["lib-easy-run"], ["lib-long-run"], []],
  "grp-speed": [["lib-series-1k"], ["lib-easy-run"], ["lib-series-400"], [], ["lib-tempo"], ["lib-easy-run"], []],
  "grp-tri": [
    ["lib-swim-tech", "lib-strength"],
    ["lib-bike-z2", "lib-easy-run"],
    ["lib-series-1k"],
    ["lib-swim-tech"],
    ["lib-bike-z2"],
    ["lib-bike-z2", "lib-easy-run"],
    ["lib-long-run"],
  ],
};

const plans: WeekPlan[] = [];
/** `${coachId}|${weekStart}` → date the week was sent. */
const sentWeeks = new Map<string, string>();
/** planId → raw edit log of an athlete's own week. */
const changes = new Map<string, PlanChange[]>();

function logChange(planId: string, change: PlanChange) {
  changes.set(planId, [...(changes.get(planId) ?? []), change]);
}

function seedGroupWeek(groupId: string, weekStart: string): WeekPlan {
  const plan: WeekPlan = {
    id: newId("plan"),
    coachId: MOCK_COACH_ID,
    weekStart,
    owner: { kind: "group", groupId },
    days: WEEK_LAYOUTS[groupId].map((day) => day.map(instance)),
  };
  plans.push(plan);
  return plan;
}

function sessionNamed(plan: WeekPlan, name: string): WorkoutSession {
  const session = planSessions(plan).find((s) => s.name === name);
  if (!session) throw new Error(`Seed: ${name} no está en el plan`);
  return session;
}

function setTimes(plan: WeekPlan, sessionId: string, repeatId: string, times: number) {
  const repeat = planSessions(plan)
    .find((sess) => sess.id === sessionId)
    ?.nodes.find((n) => n.type === "repeat" && n.id === repeatId);
  if (!repeat || repeat.type !== "repeat") throw new Error("Bloque de series no encontrado");
  repeat.times = times;
}

function customCopy(source: WeekPlan, athleteId: string): WeekPlan {
  return clonePlan(source, {
    weekStart: source.weekStart,
    owner: { kind: "athlete", athleteId, copiedFromPlanId: source.id },
  });
}

function clonePlan(source: WeekPlan, changes: Pick<WeekPlan, "weekStart" | "owner">): WeekPlan {
  // Session ids are kept so an athlete's copy still lines up with the group week; paces are keyed per plan.
  const plan: WeekPlan = { ...structuredClone(source), ...changes, id: newId("plan") };
  plans.push(plan);
  return plan;
}

// The seed lands on the current week, plus the previous one so "copy last week" has a source.
const MONDAY = mondayOfISO(toISODate(new Date()));
for (const weekStart of [addDaysISO(MONDAY, -7), MONDAY]) {
  const long = seedGroupWeek("grp-long", weekStart);
  const speed = seedGroupWeek("grp-speed", weekStart);
  const tri = seedGroupWeek("grp-tri", weekStart);
  if (weekStart !== MONDAY) {
    // Last week already went out (on the Sunday before it started).
    sentWeeks.set(`${MOCK_COACH_ID}|${weekStart}`, addDaysISO(weekStart, -1));
    continue;
  }

  // Athletes whose week the coach already edited this week (with their edit log).
  const editedOn = addDaysISO(weekStart, -1);
  const seedSets = (plan: WeekPlan, dayIndex: number, name: string, from: number, to: number) => {
    const session = sessionNamed(plan, name);
    setTimes(plan, session.id, "main", to);
    logChange(plan.id, { kind: "sets", on: editedOn, dayIndex, sessionId: session.id, sessionName: name, repeatId: "main", from, to });
  };
  seedSets(customCopy(speed, "ath-8"), 0, "Series 6×1k", 6, 4);
  seedSets(customCopy(tri, "ath-3"), 2, "Series 6×1k", 6, 4);
  // Nora races a week before her group: fewer 400s and an easy Saturday instead of the long run.
  const nora = customCopy(long, "ath-5");
  seedSets(nora, 1, "Series 400", 10, 8);
  const longRun = nora.days[5][0];
  const easy = instance("lib-easy-run");
  nora.days[5] = [easy];
  logChange(nora.id, { kind: "removed", on: editedOn, dayIndex: 5, sessionId: longRun.id, sessionName: longRun.name });
  logChange(nora.id, { kind: "added", on: editedOn, dayIndex: 5, sessionId: easy.id, sessionName: easy.name });
}

function requirePlan(planId: string, coachId: string): WeekPlan {
  const plan = plans.find((pl) => pl.id === planId && pl.coachId === coachId);
  if (!plan) throw new Error("Semana no encontrada");
  return plan;
}

function groupWeek(coachId: string, groupId: string, weekStart: string): WeekPlan | undefined {
  return plans.find(
    (pl) =>
      pl.coachId === coachId &&
      pl.weekStart === weekStart &&
      pl.owner.kind === "group" &&
      pl.owner.groupId === groupId
  );
}

export const mockWorkoutRepository: WorkoutRepository = {
  async listGroups(coachId) {
    return groups.filter((g) => g.coachId === coachId);
  },

  async moveAthleteToGroup(coachId, athleteId, groupId) {
    const target = groupId === null ? null : groups.find((g) => g.id === groupId && g.coachId === coachId);
    if (target === undefined) throw new Error("Grupo no encontrado");
    for (const g of groups) {
      if (g.coachId === coachId) g.athleteIds = g.athleteIds.filter((id) => id !== athleteId);
    }
    target?.athleteIds.push(athleteId);
  },

  async listSessionLibrary() {
    return library;
  },

  async listWeekPlans(coachId, weekStart) {
    return plans.filter((pl) => pl.coachId === coachId && pl.weekStart === weekStart);
  },

  async getWeekPlan(planId, coachId) {
    return plans.find((pl) => pl.id === planId && pl.coachId === coachId) ?? null;
  },

  async createGroupWeek(coachId, groupId, weekStart, copyPreviousWeek) {
    const existing = groupWeek(coachId, groupId, weekStart);
    if (existing) return existing;

    if (copyPreviousWeek) {
      const previous = groupWeek(coachId, groupId, addDaysISO(weekStart, -7));
      if (!previous) throw new Error("No hay semana anterior para copiar.");
      return clonePlan(previous, { weekStart, owner: { kind: "group", groupId } });
    }

    const plan: WeekPlan = {
      id: newId("plan"),
      coachId,
      weekStart,
      owner: { kind: "group", groupId },
      days: Array.from({ length: DAYS_PER_WEEK }, () => []),
    };
    plans.push(plan);
    return plan;
  },

  async createCustomWeek(coachId, athleteId, fromPlanId) {
    const source = requirePlan(fromPlanId, coachId);
    const existing = plans.find(
      (pl) =>
        pl.coachId === coachId &&
        pl.weekStart === source.weekStart &&
        pl.owner.kind === "athlete" &&
        pl.owner.athleteId === athleteId
    );
    return existing ?? customCopy(source, athleteId);
  },

  async addSession(coachId, planId, dayIndex, librarySessionId) {
    const session = instance(librarySessionId);
    requirePlan(planId, coachId).days[dayIndex].push(session);
    return session;
  },

  async removeSession(coachId, planId, sessionId) {
    const plan = requirePlan(planId, coachId);
    plan.days = plan.days.map((day) => day.filter((s) => s.id !== sessionId));
  },

  async setRepeatTimes(coachId, planId, sessionId, repeatId, times) {
    setTimes(requirePlan(planId, coachId), sessionId, repeatId, times);
  },

  async setStepSeconds(coachId, planId, sessionId, stepId, seconds) {
    const session = planSessions(requirePlan(planId, coachId)).find((sess) => sess.id === sessionId);
    const step = session?.nodes
      .flatMap((n) => (n.type === "repeat" ? n.steps : [n]))
      .find((st) => st.id === stepId);
    if (!step || step.duration.kind !== "time") throw new Error("Paso no encontrado");
    step.duration = { kind: "time", seconds };
  },

  async getWeekSentOn(coachId, weekStart) {
    return sentWeeks.get(`${coachId}|${weekStart}`) ?? null;
  },

  async markWeekSent(coachId, weekStart, sentOn) {
    sentWeeks.set(`${coachId}|${weekStart}`, sentOn);
  },

  async listPlanChanges(coachId, planId) {
    requirePlan(planId, coachId);
    return changes.get(planId) ?? [];
  },

  async addPlanChange(coachId, planId, change) {
    requirePlan(planId, coachId);
    logChange(planId, change);
  },

  async resolvePaces(coachId, planId, athleteIds) {
    const plan = requirePlan(planId, coachId);
    const result: Record<string, AthletePaces> = {};
    for (const athleteId of athleteIds) {
      const fixtures = PACE_FIXTURES[athleteId] ?? {};
      const paces: AthletePaces = {};
      for (const session of planSessions(plan)) {
        for (const step of sessionRelativeSteps(session)) {
          if (step.target.kind !== "relative") continue;
          const pace = fixtures[`${step.target.reference}@${step.target.percent}`];
          if (pace) paces[stepKey(session.id, step.id)] = pace;
        }
      }
      result[athleteId] = paces;
    }
    return result;
  },

  async getReferencePaces(_coachId, athleteIds) {
    return Object.fromEntries(
      athleteIds.filter((id) => REFERENCE_PACES[id]).map((id) => [id, REFERENCE_PACES[id]])
    );
  },
};
