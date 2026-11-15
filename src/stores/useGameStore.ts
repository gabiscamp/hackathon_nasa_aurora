import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type GameScene =
  | 'title'
  | 'briefing'
  | 'crew-intro'
  | 'tutorial'
  | 'game'
  | 'ending';

export type DayPhase = 'briefing' | 'decision' | 'result' | 'summary';

const PHASES: DayPhase[] = ['briefing', 'decision', 'result', 'summary'];

interface GameState {
  scene: GameScene;
  /** Commander's display name from the chosen crew ('' = just "Commander"). */
  playerName: string;
  /** Pre-defined crew chosen on the home screen (src/data/crews.ts). */
  crewId: string;
  day: number;
  phase: DayPhase;
  missionHistory: string[];
  /** Screen to return to with "Continue mission"; null = no mission in progress. */
  resumeScene: GameScene | null;

  setPlayerName: (name: string) => void;
  setCrewId: (crewId: string) => void;
  /** Starts a brand-new mission with the chosen crew. */
  startMission: (crewId: string, commanderName: string) => void;
  /** Goes to the home screen and keeps the mission so it can be continued. */
  goHome: () => void;
  resumeMission: () => void;
  setScene: (scene: GameScene) => void;
  setDay: (day: number) => void;
  setPhase: (phase: DayPhase) => void;
  nextPhase: () => void;
  nextDay: () => void;
  resetGame: () => void;
}

/**
 * Saved in the browser (localStorage) like the resource, crew and mission stores, so closing
 * or reloading the page keeps the mission. A mission that was open comes back exactly like
 * after "Main menu": on the home screen, with "Continue mission".
 */
export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      scene: 'title',
      playerName: '',
      crewId: '',
      day: 1,
      phase: 'briefing',
      missionHistory: [],
      resumeScene: null,

      setPlayerName: (name) => set({ playerName: name }),

      setCrewId: (crewId) => set({ crewId }),

      startMission: (crewId, commanderName) =>
        set({
          crewId,
          playerName: commanderName,
          day: 1,
          phase: 'briefing',
          missionHistory: [],
          resumeScene: null,
          scene: 'briefing',
        }),

      goHome: () =>
        set((state) => ({
          resumeScene: state.scene === 'title' || state.scene === 'ending' ? state.resumeScene : state.scene,
          scene: 'title',
        })),

      resumeMission: () =>
        set((state) => ({ scene: state.resumeScene ?? 'briefing', resumeScene: null })),

      setScene: (scene) => set({ scene }),

      setDay: (day) => set({ day }),

      setPhase: (phase) => set({ phase }),

      nextPhase: () =>
        set((state) => {
          const idx = PHASES.indexOf(state.phase);
          const nextIdx = (idx + 1) % PHASES.length;
          return { phase: PHASES[nextIdx] };
        }),

      nextDay: () =>
        set((state) => {
          const nextDay = state.day + 1;
          if (nextDay > 90) {
            return { scene: 'ending' as GameScene };
          }
          return { day: nextDay, phase: 'briefing' as DayPhase };
        }),

      resetGame: () =>
        set({
          scene: 'title',
          playerName: '',
          crewId: '',
          day: 1,
          phase: 'briefing',
          missionHistory: [],
          resumeScene: null,
        }),
    }),
    {
      name: 'aurora-game-store',
      partialize: (s) => ({
        scene: s.scene,
        playerName: s.playerName,
        crewId: s.crewId,
        day: s.day,
        phase: s.phase,
        missionHistory: s.missionHistory,
        resumeScene: s.resumeScene,
      }),
      // Reopening the page never drops the player in the middle of a screen: an open mission
      // goes to the home screen with "Continue mission" (same as goHome).
      merge: (persisted, current) => {
        const saved = { ...current, ...(persisted as Partial<GameState>) };
        if (saved.scene !== 'title' && saved.scene !== 'ending') {
          return { ...saved, resumeScene: saved.scene, scene: 'title' as GameScene };
        }
        return saved;
      },
    },
  ),
);
