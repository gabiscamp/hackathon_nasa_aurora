import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MISSIONS, type Mission, type StationCondition } from '../data/missions';
import type { Resources } from './useResourceStore';

/** A follow-up mission waiting for its day (set off by an earlier choice). */
export interface ScheduledEvent {
  missionId: string;
  day: number;
  unlessFlag?: string;
}

/** A lasting station condition, with the day it started (and ends, when it has a length). */
export interface ActiveCondition extends StationCondition {
  startDay: number;
  /** Last day it applies; undefined = until a choice clears it. */
  untilDay?: number;
}

/** What the player chose, kept for later consequences and the ending. */
export interface DecisionRecord {
  missionId: string;
  choiceId: string;
  day: number;
  success: boolean;
}

/** Oxygen candles on board at the start (missoes.txt, mission 5: "You have 12 candles"). */
export const START_CANDLES = 12;

interface MissionState {
  /** The mission whose window is open right now. */
  currentMission: Mission | null;
  completedMissions: string[];
  /** Problems waiting today: a "!" on the map for each one. */
  openEvents: string[];
  scheduled: ScheduledEvent[];
  conditions: ActiveCondition[];
  /** Facts about the station set by earlier choices ("hull-fixed", "spare-parts"…). */
  flags: string[];
  candles: number;
  decisions: DecisionRecord[];
  /** Choices already tried and failed today, per mission ("pick another option fast"). */
  lockedChoices: Record<string, string[]>;
  /** Resources when the player started the day (the day summary compares with it). */
  dayStart: Resources | null;

  setMission: (mission: Mission) => void;
  completeMission: (missionId: string) => void;
  clearMission: () => void;
  getMissionForDay: (day: number, act: 1 | 2 | 3) => Mission | null;
  reset: () => void;
}

// Saved in the browser so "Continue mission" keeps finished missions and every consequence.
export const useMissionStore = create<MissionState>()(
  persist(
    (set, get) => ({
      currentMission: null,
      completedMissions: [],
      openEvents: [],
      scheduled: [],
      conditions: [],
      flags: [],
      candles: START_CANDLES,
      decisions: [],
      lockedChoices: {},
      dayStart: null,

      setMission: (mission) => set({ currentMission: mission }),

      completeMission: (missionId) =>
        set((state) => ({
          completedMissions: state.completedMissions.includes(missionId)
            ? state.completedMissions
            : [...state.completedMissions, missionId],
          openEvents: state.openEvents.filter((id) => id !== missionId),
          currentMission: null,
        })),

      clearMission: () => set({ currentMission: null }),

      getMissionForDay: (day, act) => {
        const { completedMissions } = get();
        const fixed = MISSIONS.find((m) => m.day === day && !m.followUpOnly && !completedMissions.includes(m.id));
        if (fixed) return fixed;

        const pool = MISSIONS.filter(
          (m) => m.act === act && !m.day && !m.followUpOnly && !completedMissions.includes(m.id),
        );
        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
      },

      reset: () =>
        set({
          currentMission: null,
          completedMissions: [],
          openEvents: [],
          scheduled: [],
          conditions: [],
          flags: [],
          candles: START_CANDLES,
          decisions: [],
          lockedChoices: {},
          dayStart: null,
        }),
    }),
    {
      name: 'aurora-mission-store',
      version: 2,
      // v1 saves had only currentMission + completedMissions: the new lists start empty.
      migrate: (persisted) => {
        const old = (persisted ?? {}) as Partial<MissionState>;
        return {
          currentMission: old.currentMission ?? null,
          completedMissions: old.completedMissions ?? [],
          openEvents: old.openEvents ?? [],
          scheduled: old.scheduled ?? [],
          conditions: old.conditions ?? [],
          flags: old.flags ?? [],
          candles: old.candles ?? START_CANDLES,
          decisions: old.decisions ?? [],
          lockedChoices: old.lockedChoices ?? {},
          dayStart: old.dayStart ?? null,
        } as MissionState;
      },
    },
  ),
);
