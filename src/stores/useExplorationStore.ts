import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  EXPLORATION_REPORTS,
  generateExplorationOptions,
  type ExplorationOption,
  type ExplorationReport,
} from '../data/exploration';

const FAILURE_PITY_LIMIT = 2;

export interface ActiveExploration {
  mission: ExplorationOption;
  startedDay: number;
  returnDay: number;
}

export interface ExplorationOutcome {
  mission: ExplorationOption;
  succeeded: boolean;
  report: ExplorationReport | null;
  wasGuaranteed: boolean;
}

interface ExplorationState {
  status: 'aboard' | 'exploring';
  options: ExplorationOption[];
  active: ActiveExploration | null;
  unlockedReportIds: string[];
  consecutiveFailures: number;
  totalExplorationHours: number;
  minerals: number;
  lastOutcome: ExplorationOutcome | null;
  medalAwarded: boolean;
  celebrationPending: boolean;
  openMissionMenu: () => void;
  clearOptions: () => void;
  startExploration: (mission: ExplorationOption, currentDay: number) => void;
  resolveExploration: (currentDay: number, roll?: number) => ExplorationOutcome | null;
  clearOutcome: () => void;
  dismissCelebration: () => void;
  reset: () => void;
}

const INITIAL = {
  status: 'aboard' as const,
  options: [] as ExplorationOption[],
  active: null as ActiveExploration | null,
  unlockedReportIds: [] as string[],
  consecutiveFailures: 0,
  totalExplorationHours: 0,
  minerals: 0,
  lastOutcome: null as ExplorationOutcome | null,
  medalAwarded: false,
  celebrationPending: false,
};

function pickNewReport(unlocked: readonly string[], mission: ExplorationOption): ExplorationReport | null {
  const unseen = EXPLORATION_REPORTS.filter((report) => !unlocked.includes(report.id));
  if (unseen.length === 0) return null;
  const preferred = unseen.filter((report) => report.preferredRisk === mission.risk);
  const pool = preferred.length > 0 ? preferred : unseen;
  return pool[Math.floor(Math.random() * pool.length)];
}

export const useExplorationStore = create<ExplorationState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      openMissionMenu: () => set({ options: generateExplorationOptions(), lastOutcome: null }),
      clearOptions: () => set({ options: [] }),

      startExploration: (mission, currentDay) =>
        set((state) => ({
          status: 'exploring',
          options: [],
          active: {
            mission,
            startedDay: currentDay,
            returnDay: currentDay + Math.ceil(mission.durationHours / 24),
          },
          totalExplorationHours: state.totalExplorationHours + mission.durationHours,
          lastOutcome: null,
        })),

      resolveExploration: (currentDay, roll = Math.random()) => {
        const state = get();
        if (!state.active || currentDay < state.active.returnDay) return null;

        const mission = state.active.mission;
        const wasGuaranteed = state.consecutiveFailures >= FAILURE_PITY_LIMIT;
        const succeeded = wasGuaranteed || roll < mission.successChance;
        const report = succeeded ? pickNewReport(state.unlockedReportIds, mission) : null;
        const unlockedReportIds = report
          ? [...state.unlockedReportIds, report.id]
          : state.unlockedReportIds;
        const earnsMedal = unlockedReportIds.length === EXPLORATION_REPORTS.length && !state.medalAwarded;
        const outcome: ExplorationOutcome = { mission, succeeded, report, wasGuaranteed };

        set({
          status: 'aboard',
          active: null,
          unlockedReportIds,
          consecutiveFailures: succeeded ? 0 : state.consecutiveFailures + 1,
          minerals: state.minerals + (succeeded ? mission.reward.minerals : 0),
          lastOutcome: outcome,
          medalAwarded: state.medalAwarded || earnsMedal,
          celebrationPending: state.celebrationPending || earnsMedal,
        });
        return outcome;
      },

      clearOutcome: () => set({ lastOutcome: null }),
      dismissCelebration: () => set({ celebrationPending: false }),
      reset: () => set(INITIAL),
    }),
    {
      name: 'aurora-exploration-store',
      version: 2,
      migrate: (persisted, version) => {
        const saved = (persisted ?? {}) as Partial<ExplorationState>;
        return {
          status: version < 2 ? 'aboard' : saved.status ?? INITIAL.status,
          active: version < 2 ? null : saved.active ?? INITIAL.active,
          unlockedReportIds: saved.unlockedReportIds ?? INITIAL.unlockedReportIds,
          consecutiveFailures: saved.consecutiveFailures ?? INITIAL.consecutiveFailures,
          totalExplorationHours: saved.totalExplorationHours ?? INITIAL.totalExplorationHours,
          minerals: saved.minerals ?? INITIAL.minerals,
          lastOutcome: version < 2 ? null : saved.lastOutcome ?? INITIAL.lastOutcome,
          medalAwarded: saved.medalAwarded ?? INITIAL.medalAwarded,
          celebrationPending: saved.celebrationPending ?? INITIAL.celebrationPending,
        };
      },
      partialize: (state) => ({
        status: state.status,
        active: state.active,
        unlockedReportIds: state.unlockedReportIds,
        consecutiveFailures: state.consecutiveFailures,
        totalExplorationHours: state.totalExplorationHours,
        minerals: state.minerals,
        lastOutcome: state.lastOutcome,
        medalAwarded: state.medalAwarded,
        celebrationPending: state.celebrationPending,
      }),
    },
  ),
);
