import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clamp } from '../utils/clamp';

/**
 * Station resources, 0–100 each (team decision, 2026-11-15):
 * food, water, oxygen and energy — higher is better;
 * radiation — the radiation level inside the station, higher is WORSE.
 */
export interface Resources {
  food: number;
  water: number;
  oxygen: number;
  radiation: number;
  energy: number;
}

export type ResourceKey = keyof Resources;
export const RESOURCE_KEYS: readonly ResourceKey[] = ['food', 'water', 'oxygen', 'radiation', 'energy'];

interface ResourceState extends Resources {
  applyDelta: (delta: Partial<Resources>) => void;
  tick: (act: 1 | 2 | 3) => void;
  reset: () => void;
}

const INITIAL: Resources = {
  food: 90,
  water: 90,
  oxygen: 90,
  radiation: 20,
  energy: 85,
};

/** 0–100 "how safe is the station": radiation counts inverted. Used by the ending and crew mood. */
export function stationScore(r: Resources): number {
  return (r.food + r.water + r.oxygen + (100 - r.radiation) + r.energy) / 5;
}

// Saved in the browser so "Continue mission" keeps the resources.
export const useResourceStore = create<ResourceState>()(
  persist(
    (set) => ({
      ...INITIAL,

      applyDelta: (delta) =>
        set((state) => {
          const next: Partial<Resources> = {};
          for (const key of RESOURCE_KEYS) {
            const d = delta[key];
            if (d !== undefined) next[key] = clamp(state[key] + d, 0, 100);
          }
          return next;
        }),

      tick: (act) =>
        set((state) => {
          const decay = act === 1 ? 1 : act === 2 ? 2 : 3;
          const oxygenMultiplier = state.energy < 20 ? 2 : 1;
          return {
            food: clamp(state.food - decay, 0, 100),
            water: clamp(state.water - decay, 0, 100),
            oxygen: clamp(state.oxygen - decay * oxygenMultiplier, 0, 100),
            radiation: clamp(state.radiation + decay, 0, 100),
            energy: clamp(state.energy - decay, 0, 100),
          };
        }),

      reset: () => set(INITIAL),
    }),
    {
      name: 'aurora-resource-store',
      version: 2,
      // v1 saves had energy/oxygen/shielding: shielding 80 = well protected → radiation 20.
      migrate: (persisted, version) => {
        const old = (persisted ?? {}) as Partial<Resources> & { shielding?: number };
        if (version < 2) {
          return {
            ...INITIAL,
            energy: old.energy ?? INITIAL.energy,
            oxygen: old.oxygen ?? INITIAL.oxygen,
            radiation: old.shielding !== undefined ? 100 - old.shielding : INITIAL.radiation,
          };
        }
        return old as Resources;
      },
    },
  ),
);
