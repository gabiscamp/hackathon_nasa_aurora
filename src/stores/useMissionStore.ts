import { create } from 'zustand';
import { MISSIONS, type Mission } from '../data/missions';

interface MissionState {
  currentMission: Mission | null;
  completedMissions: string[];

  setMission: (mission: Mission) => void;
  completeMission: (missionId: string) => void;
  clearMission: () => void;
  getMissionForDay: (day: number, act: 1 | 2 | 3) => Mission | null;
  reset: () => void;
}

export const useMissionStore = create<MissionState>()((set, get) => ({
  currentMission: null,
  completedMissions: [],

  setMission: (mission) => set({ currentMission: mission }),

  completeMission: (missionId) =>
    set((state) => ({
      completedMissions: [...state.completedMissions, missionId],
      currentMission: null,
    })),

  clearMission: () => set({ currentMission: null }),

  getMissionForDay: (day, act) => {
    const { completedMissions } = get();
    const fixed = MISSIONS.find(
      (m) => m.day === day && !completedMissions.includes(m.id),
    );
    if (fixed) return fixed;

    const pool = MISSIONS.filter(
      (m) => m.act === act && !m.day && !completedMissions.includes(m.id),
    );
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  },

  reset: () => set({ currentMission: null, completedMissions: [] }),
}));
