import { cache } from "react";
import { apiAthleteRepository } from "./athletes-repo.api";
import { MOCK_ATHLETE_IDS, MOCK_COACH_ID, mockWorkoutRepository } from "./workouts-repo.mock";
import type { WorkoutRepository } from "@/lib/domain/repositories";
import type { TrainingGroup, WeekPlan } from "@/lib/domain/workouts";

/*
 * Bridge until workouts move to the API (roadmap phase 8): athletes are real
 * (API uuids, signed-in coach) but the workouts mock is seeded with its own
 * coach and "ath-1"…"ath-8". This wrapper maps the coach's real athletes,
 * oldest first, onto those seed ids, so the seeded groups, weeks and paces
 * show up on real athletes. Athletes beyond the eighth keep their real id
 * inside the mock (they start ungrouped), and seed ids with no real athlete
 * behind them are hidden.
 */

interface IdMap {
  toMock: (realId: string) => string;
  toReal: (mockId: string) => string | undefined;
}

/** Built once per request: a page calls the repository several times. */
const idMap = cache(async (): Promise<IdMap> => {
  const athletes = await apiAthleteRepository.listByCoach("");
  // The API's ids are UUIDv7, so sorting them sorts by creation.
  const realIds = athletes.map((a) => a.id).sort();
  const mockToReal = new Map(MOCK_ATHLETE_IDS.flatMap((mockId, i) => (realIds[i] ? [[mockId, realIds[i]]] : [])));
  const realToMock = new Map([...mockToReal].map(([mockId, realId]) => [realId, mockId]));

  return {
    toMock: (realId) => realToMock.get(realId) ?? realId,
    toReal: (mockId) => (MOCK_ATHLETE_IDS.includes(mockId) ? mockToReal.get(mockId) : mockId),
  };
});

function rekeyGroup(group: TrainingGroup, coachId: string, ids: IdMap): TrainingGroup {
  return {
    ...group,
    coachId,
    athleteIds: group.athleteIds.flatMap((id) => ids.toReal(id) ?? []),
  };
}

/** Null when the plan is the custom week of a seed athlete with no real athlete behind it. */
function rekeyPlan(plan: WeekPlan, coachId: string, ids: IdMap): WeekPlan | null {
  if (plan.owner.kind === "group") return { ...plan, coachId };
  const athleteId = ids.toReal(plan.owner.athleteId);
  return athleteId ? { ...plan, coachId, owner: { ...plan.owner, athleteId } } : null;
}

function rekeyByAthlete<T>(byMockId: Record<string, T>, ids: IdMap): Record<string, T> {
  return Object.fromEntries(
    Object.entries(byMockId).flatMap(([mockId, value]) => {
      const realId = ids.toReal(mockId);
      return realId ? [[realId, value]] : [];
    })
  );
}

const base = mockWorkoutRepository;

export const rekeyedWorkoutRepository: WorkoutRepository = {
  async listGroups(coachId) {
    const ids = await idMap();
    return (await base.listGroups(MOCK_COACH_ID)).map((g) => rekeyGroup(g, coachId, ids));
  },

  async moveAthleteToGroup(_coachId, athleteId, groupId) {
    const ids = await idMap();
    return base.moveAthleteToGroup(MOCK_COACH_ID, ids.toMock(athleteId), groupId);
  },

  listSessionLibrary: () => base.listSessionLibrary(MOCK_COACH_ID),

  async listWeekPlans(coachId, weekStart) {
    const ids = await idMap();
    const plans = await base.listWeekPlans(MOCK_COACH_ID, weekStart);
    return plans.flatMap((plan) => rekeyPlan(plan, coachId, ids) ?? []);
  },

  async getWeekPlan(planId, coachId) {
    const ids = await idMap();
    const plan = await base.getWeekPlan(planId, MOCK_COACH_ID);
    return plan && rekeyPlan(plan, coachId, ids);
  },

  async createGroupWeek(coachId, groupId, weekStart, copyPreviousWeek) {
    const plan = await base.createGroupWeek(MOCK_COACH_ID, groupId, weekStart, copyPreviousWeek);
    return { ...plan, coachId };
  },

  async createCustomWeek(coachId, athleteId, fromPlanId) {
    const ids = await idMap();
    const plan = await base.createCustomWeek(MOCK_COACH_ID, ids.toMock(athleteId), fromPlanId);
    return rekeyPlan(plan, coachId, ids)!;
  },

  addSession: (_coachId, planId, dayIndex, librarySessionId) =>
    base.addSession(MOCK_COACH_ID, planId, dayIndex, librarySessionId),
  removeSession: (_coachId, planId, sessionId) => base.removeSession(MOCK_COACH_ID, planId, sessionId),
  setRepeatTimes: (_coachId, planId, sessionId, repeatId, times) =>
    base.setRepeatTimes(MOCK_COACH_ID, planId, sessionId, repeatId, times),
  setStepSeconds: (_coachId, planId, sessionId, stepId, seconds) =>
    base.setStepSeconds(MOCK_COACH_ID, planId, sessionId, stepId, seconds),
  getWeekSentOn: (_coachId, weekStart) => base.getWeekSentOn(MOCK_COACH_ID, weekStart),
  markWeekSent: (_coachId, weekStart, sentOn) => base.markWeekSent(MOCK_COACH_ID, weekStart, sentOn),
  listPlanChanges: (_coachId, planId) => base.listPlanChanges(MOCK_COACH_ID, planId),
  addPlanChange: (_coachId, planId, change) => base.addPlanChange(MOCK_COACH_ID, planId, change),

  async resolvePaces(_coachId, planId, athleteIds) {
    const ids = await idMap();
    const paces = await base.resolvePaces(MOCK_COACH_ID, planId, athleteIds.map(ids.toMock));
    return rekeyByAthlete(paces, ids);
  },

  async getReferencePaces(_coachId, athleteIds) {
    const ids = await idMap();
    const paces = await base.getReferencePaces(MOCK_COACH_ID, athleteIds.map(ids.toMock));
    return rekeyByAthlete(paces, ids);
  },
};
