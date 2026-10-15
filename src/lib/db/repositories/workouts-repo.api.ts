import { ApiNotFoundError, apiFetch } from "@/lib/api/client";
import type { AthleteWeek, WorkoutRepository } from "@/lib/domain/repositories";
import type { TrainingGroup, WeekPlan, WorkoutSession } from "@/lib/domain/workouts";

/*
 * The API's shapes (docs/api.md in ../umbral-training-api) already match the
 * domain types: WeekPlan, TrainingGroup, WorkoutSession, PlanChange and the
 * pace maps. Plan sessions also carry `librarySessionId`, which nothing here
 * needs. Errors come back from apiFetch with the API's Spanish message.
 */

const path = (...parts: string[]) => "/v1/" + parts.map(encodeURIComponent).join("/");

/** `?athleteIds[]=a&athleteIds[]=b` */
const athleteQuery = (athleteIds: string[]) =>
  athleteIds.map((id) => `athleteIds[]=${encodeURIComponent(id)}`).join("&");

const athleteWeekPath = (athleteId: string, weekStart: string, ...rest: string[]) =>
  path("weeks", weekStart, "athletes", athleteId, ...rest);

export const apiWorkoutRepository: WorkoutRepository = {
  listGroups: () => apiFetch<TrainingGroup[]>("GET", path("groups")),
  createGroup: (name) => apiFetch<TrainingGroup>("POST", path("groups"), { name }),
  renameGroup: (groupId, name) => apiFetch<TrainingGroup>("PUT", path("groups", groupId), { name }),

  async deleteGroup(groupId) {
    await apiFetch<void>("DELETE", path("groups", groupId));
  },

  async moveAthleteToGroup(athleteId, groupId) {
    await apiFetch("PUT", path("athletes", athleteId, "group"), { groupId });
  },

  listSessionLibrary: () => apiFetch<WorkoutSession[]>("GET", path("library", "sessions")),

  async getLibrarySession(sessionId) {
    try {
      return await apiFetch<WorkoutSession>("GET", path("library", "sessions", sessionId));
    } catch (error) {
      if (error instanceof ApiNotFoundError) return null;
      throw error;
    }
  },

  createLibrarySession: (input) => apiFetch<WorkoutSession>("POST", path("library", "sessions"), input),
  updateLibrarySession: (sessionId, input) =>
    apiFetch<WorkoutSession>("PUT", path("library", "sessions", sessionId), input),

  async deleteLibrarySession(sessionId) {
    await apiFetch<void>("DELETE", path("library", "sessions", sessionId));
  },

  getWeek: (weekStart) =>
    apiFetch<{ weekStart: string; sentOn: string | null; plans: WeekPlan[] }>("GET", path("weeks", weekStart)),

  async getWeekPlan(planId) {
    try {
      return await apiFetch<WeekPlan>("GET", path("plans", planId));
    } catch (error) {
      if (error instanceof ApiNotFoundError) return null;
      throw error;
    }
  },

  createGroupWeek: (groupId, weekStart, copyPreviousWeek) =>
    apiFetch<WeekPlan>("POST", path("weeks", weekStart, "groups", groupId, "plan"), { copyPreviousWeek }),

  addSession: (planId, dayIndex, librarySessionId) =>
    apiFetch<WeekPlan>("POST", path("plans", planId, "days", String(dayIndex), "sessions"), { librarySessionId }),

  removeSession: (planId, sessionId) => apiFetch<WeekPlan>("DELETE", path("plans", planId, "sessions", sessionId)),

  getAthleteWeek: (athleteId, weekStart) => apiFetch<AthleteWeek>("GET", athleteWeekPath(athleteId, weekStart)),

  addAthleteSession: (athleteId, weekStart, dayIndex, librarySessionId) =>
    apiFetch<AthleteWeek>("POST", athleteWeekPath(athleteId, weekStart, "days", String(dayIndex), "sessions"), {
      librarySessionId,
    }),

  replaceAthleteSession: (athleteId, weekStart, sessionId, session) =>
    apiFetch<AthleteWeek>("PUT", athleteWeekPath(athleteId, weekStart, "sessions", sessionId), session),

  removeAthleteSession: (athleteId, weekStart, sessionId) =>
    apiFetch<AthleteWeek>("DELETE", athleteWeekPath(athleteId, weekStart, "sessions", sessionId)),

  setAthleteRepeatTimes: (athleteId, weekStart, sessionId, repeatId, times) =>
    apiFetch<AthleteWeek>("PUT", athleteWeekPath(athleteId, weekStart, "sessions", sessionId, "repeats", repeatId), {
      times,
    }),

  setAthleteStepSeconds: (athleteId, weekStart, sessionId, stepId, seconds) =>
    apiFetch<AthleteWeek>("PUT", athleteWeekPath(athleteId, weekStart, "sessions", sessionId, "steps", stepId), {
      seconds,
    }),

  async markWeekSent(weekStart) {
    const { sentOn } = await apiFetch<{ sentOn: string }>("POST", path("weeks", weekStart, "send"));
    return sentOn;
  },

  resolvePaces: (planId, athleteIds) =>
    apiFetch("GET", `${path("plans", planId, "paces")}?${athleteQuery(athleteIds)}`),

  getReferencePaces: (athleteIds) => apiFetch("GET", `${path("reference-paces")}?${athleteQuery(athleteIds)}`),
};
