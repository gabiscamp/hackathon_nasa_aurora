import { create } from 'zustand';
import { CREW_DEFINITIONS, type CrewMember } from '../data/crew';
import { clamp } from '../utils/clamp';

type CrewRecord = Record<string, CrewMember>;

interface CrewState {
  crew: CrewRecord;

  updateCrew: (id: string, partial: Partial<CrewMember>) => void;
  dailyMoraleTick: (resources: { energy: number; oxygen: number; shielding: number }) => void;
  reset: () => void;
}

function buildInitialCrew(): CrewRecord {
  const record: CrewRecord = {};
  for (const def of CREW_DEFINITIONS) {
    record[def.id] = { ...def, health: 100, morale: 100 };
  }
  return record;
}

export const useCrewStore = create<CrewState>()((set) => ({
  crew: buildInitialCrew(),

  updateCrew: (id, partial) =>
    set((state) => ({
      crew: {
        ...state.crew,
        [id]: { ...state.crew[id], ...partial },
      },
    })),

  dailyMoraleTick: (resources) =>
    set((state) => {
      const avg = (resources.energy + resources.oxygen + resources.shielding) / 3;
      if (avg >= 50) return state;

      const decay = avg < 20 ? -3 : -1;
      const updated: CrewRecord = {};
      for (const [id, member] of Object.entries(state.crew)) {
        updated[id] = {
          ...member,
          morale: clamp(member.morale + decay, 0, 100),
        };
      }
      return { crew: updated };
    }),

  reset: () => set({ crew: buildInitialCrew() }),
}));
