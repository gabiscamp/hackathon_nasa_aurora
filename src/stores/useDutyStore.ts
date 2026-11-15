import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CrewSlot } from '../data/missions';

/** Everyone who can be sent to a job, in the order the crew picker shows them. */
export const CREW_SLOTS: readonly CrewSlot[] = ['commander', 'engineer', 'medic', 'scientist'];

/** Tiredness scale: 0-1 rested, 2 tired (slower), 3 very tired (mistakes), 4 exhausted (must rest). */
export const FATIGUE_TIRED = 2;
export const FATIGUE_VERY_TIRED = 3;
export const FATIGUE_EXHAUSTED = 4;

/** A job a crew member is doing (the same job can hold several people). */
export interface DutyTask {
  /** Unique per assignment, shared by everyone on the same job. */
  taskId: string;
  missionId: string;
  choiceId: string;
  label: string;
  room: string;
  startDay: number;
  /** Last day of work; free again the day after. */
  untilDay: number;
}

export interface CrewDuty {
  /** 0..4 (see FATIGUE_*). Personal state, not a station resource. */
  fatigue: number;
  task: DutyTask | null;
  /** Can't be sent until after this day (resting after an exhausting or scary job). */
  restUntilDay: number;
}

type DutyRecord = Record<CrewSlot, CrewDuty>;

function freshCrew(): DutyRecord {
  const record = {} as DutyRecord;
  for (const slot of CREW_SLOTS) record[slot] = { fatigue: 0, task: null, restUntilDay: 0 };
  return record;
}

interface DutyState {
  crew: DutyRecord;
  /** Last morning already processed by the mission engine (each day runs once, skipped days too). */
  lastTickDay: number;
  setDuty: (slot: CrewSlot, partial: Partial<CrewDuty>) => void;
  setAll: (crew: DutyRecord) => void;
  reset: () => void;
}

/** Who is busy, resting or tired. Saved so "Continue mission" keeps the crew's jobs. */
export const useDutyStore = create<DutyState>()(
  persist(
    (set) => ({
      crew: freshCrew(),
      lastTickDay: 1,
      setDuty: (slot, partial) => set((s) => ({ crew: { ...s.crew, [slot]: { ...s.crew[slot], ...partial } } })),
      setAll: (crew) => set({ crew }),
      reset: () => set({ crew: freshCrew(), lastTickDay: 1 }),
    }),
    { name: 'aurora-duty-store', version: 1 },
  ),
);

export type CrewAvailability = 'free' | 'busy' | 'resting';

export function availability(duty: CrewDuty, day: number): CrewAvailability {
  if (duty.restUntilDay >= day) return 'resting';
  if (duty.task && duty.task.untilDay >= day) return 'busy';
  return 'free';
}

export function fatigueLabel(fatigue: number): string {
  if (fatigue >= FATIGUE_EXHAUSTED) return 'Exhausted';
  if (fatigue >= FATIGUE_VERY_TIRED) return 'Very tired';
  if (fatigue >= FATIGUE_TIRED) return 'Tired';
  return 'Rested';
}
