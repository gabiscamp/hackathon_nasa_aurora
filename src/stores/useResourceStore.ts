import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clamp } from '../utils/clamp';

interface ResourceState {
  energy: number;
  oxygen: number;
  shielding: number;

  applyDelta: (delta: Partial<Pick<ResourceState, 'energy' | 'oxygen' | 'shielding'>>) => void;
  tick: (act: 1 | 2 | 3) => void;
  reset: () => void;
}

const INITIAL: Pick<ResourceState, 'energy' | 'oxygen' | 'shielding'> = {
  energy: 85,
  oxygen: 90,
  shielding: 80,
};

// Saved in the browser so "Continue mission" keeps the resources.
export const useResourceStore = create<ResourceState>()(
  persist(
    (set) => ({
      ...INITIAL,

      applyDelta: (delta) =>
        set((state) => ({
          energy: clamp(state.energy + (delta.energy ?? 0), 0, 100),
          oxygen: clamp(state.oxygen + (delta.oxygen ?? 0), 0, 100),
          shielding: clamp(state.shielding + (delta.shielding ?? 0), 0, 100),
        })),

      tick: (act) =>
        set((state) => {
          const decay = act === 1 ? 1 : act === 2 ? 2 : 3;
          const oxygenMultiplier = state.energy < 20 ? 2 : 1;
          return {
            energy: clamp(state.energy - decay, 0, 100),
            oxygen: clamp(state.oxygen - decay * oxygenMultiplier, 0, 100),
            shielding: clamp(state.shielding - decay, 0, 100),
          };
        }),

      reset: () => set(INITIAL),
    }),
    { name: 'aurora-resource-store' },
  ),
);
