import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CREW_ROLES, type CrewMember, type CrewRole } from '../data/crew';
import { DEFAULT_TEAM_ID, getTeam } from '../data/crews';
import { clamp } from '../utils/clamp';

type CrewRecord = Record<CrewRole, CrewMember>;

interface CrewState {
  /** Which pre-defined crew (src/data/crews.ts) is on board. */
  teamId: string;
  crew: CrewRecord;

  /** Puts a crew on board with full health and morale. */
  selectTeam: (teamId: string) => void;
  updateCrew: (id: string, partial: Partial<CrewMember>) => void;
  dailyMoraleTick: (resources: { energy: number; oxygen: number; shielding: number }) => void;
  reset: () => void;
}

function buildInitialCrew(teamId: string): CrewRecord {
  const team = getTeam(teamId);
  const record = {} as CrewRecord;
  for (const role of CREW_ROLES) {
    record[role] = { ...team.members[role], health: 100, morale: 100 };
  }
  return record;
}

function isRole(id: string): id is CrewRole {
  return (CREW_ROLES as readonly string[]).includes(id);
}

// Saved in the browser so "Continue mission" keeps the crew and their health.
export const useCrewStore = create<CrewState>()(
  persist(
    (set) => ({
      teamId: DEFAULT_TEAM_ID,
      crew: buildInitialCrew(DEFAULT_TEAM_ID),

      selectTeam: (teamId) => set({ teamId, crew: buildInitialCrew(teamId) }),

      updateCrew: (id, partial) =>
        set((state) => {
          if (!isRole(id)) return state;
          return { crew: { ...state.crew, [id]: { ...state.crew[id], ...partial } } };
        }),

      dailyMoraleTick: (resources) =>
        set((state) => {
          const avg = (resources.energy + resources.oxygen + resources.shielding) / 3;
          if (avg >= 50) return state;

          const decay = avg < 20 ? -3 : -1;
          const updated = {} as CrewRecord;
          for (const role of CREW_ROLES) {
            const member = state.crew[role];
            updated[role] = { ...member, morale: clamp(member.morale + decay, 0, 100) };
          }
          return { crew: updated };
        }),

      reset: () => set((state) => ({ crew: buildInitialCrew(state.teamId) })),
    }),
    { name: 'aurora-crew-store', version: 2 },
  ),
);
