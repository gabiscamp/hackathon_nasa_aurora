import { create } from 'zustand';

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
  playerName: string;
  day: number;
  phase: DayPhase;
  missionHistory: string[];

  setPlayerName: (name: string) => void;
  setScene: (scene: GameScene) => void;
  setPhase: (phase: DayPhase) => void;
  nextPhase: () => void;
  nextDay: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()((set) => ({
  scene: 'title',
  playerName: '',
  day: 1,
  phase: 'briefing',
  missionHistory: [],

  setPlayerName: (name) => set({ playerName: name }),

  setScene: (scene) => set({ scene }),

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
      day: 1,
      phase: 'briefing',
      missionHistory: [],
    }),
}));
