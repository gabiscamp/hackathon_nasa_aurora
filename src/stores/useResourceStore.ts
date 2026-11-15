import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clamp } from '../utils/clamp';

export type ResourceKey = 'food' | 'water' | 'energy' | 'oxygen' | 'health' | 'satisfaction' | 'radiation';

type ResourceValues = Record<ResourceKey, number>;

interface ResourceState extends ResourceValues {
  applyDelta: (delta: Partial<ResourceValues>) => void;
  tick: () => void;
  reset: () => void;
}

const INITIAL: ResourceValues = {
  food: 100,
  water: 100,
  energy: 100,
  oxygen: 100,
  health: 100,
  satisfaction: 80,
  radiation: 0,
};

// Saved in the browser so "Continue mission" keeps the resources.
export const useResourceStore = create<ResourceState>()(
  persist(
    (set) => ({
      ...INITIAL,

      applyDelta: (delta) =>
        set((state) => {
          const next: Partial<ResourceValues> = {};
          for (const key of Object.keys(delta) as ResourceKey[]) {
            const v = state[key] + (delta[key] ?? 0);
            next[key] = clamp(v, 0, 100);
          }
          return next;
        }),

      tick: () =>
        set((state) => {
          const oxygenPenalty = state.energy <= 0 ? -10 : 0;
          const healthPenalty = state.oxygen < 20 ? -5 : 0;
          return {
            food: clamp(state.food - 1, 0, 100),
            water: clamp(state.water - 1, 0, 100),
            oxygen: clamp(state.oxygen + oxygenPenalty, 0, 100),
            health: clamp(state.health + healthPenalty, 0, 100),
            radiation: clamp(state.radiation + 0.5, 0, 100),
          };
        }),

      reset: () => set(INITIAL),
    }),
    { name: 'aurora-resource-store' },
  ),
);
