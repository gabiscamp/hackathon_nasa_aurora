import { clamp } from '../utils/clamp';
import type { Choice } from '../data/missions';

interface Resources {
  energy: number;
  oxygen: number;
  shielding: number;
}

interface ResourceStore {
  applyDelta: (delta: Partial<Resources>) => void;
}

interface CrewStore {
  updateCrew: (id: string, partial: { health?: number; morale?: number }) => void;
}

export function applyConsequences(
  resourceStore: ResourceStore,
  crewStore: CrewStore,
  consequences: Choice['consequences'],
): void {
  const { energy, oxygen, shielding, crewEffects } = consequences;

  const delta: Partial<Resources> = {};
  if (energy !== undefined) delta.energy = energy;
  if (oxygen !== undefined) delta.oxygen = oxygen;
  if (shielding !== undefined) delta.shielding = shielding;

  if (Object.keys(delta).length > 0) {
    resourceStore.applyDelta(delta);
  }

  if (crewEffects) {
    for (const effect of crewEffects) {
      crewStore.updateCrew(effect.id, {
        ...(effect.health !== undefined && { health: effect.health }),
        ...(effect.morale !== undefined && { morale: effect.morale }),
      });
    }
  }
}

export function dailyTick(
  act: 1 | 2 | 3,
  current: Resources,
): Resources {
  const decay = act === 1 ? 1 : act === 2 ? 2 : 3;
  const oxygenMultiplier = current.energy < 20 ? 2 : 1;

  return {
    energy: clamp(current.energy - decay, 0, 100),
    oxygen: clamp(current.oxygen - decay * oxygenMultiplier, 0, 100),
    shielding: clamp(current.shielding - decay, 0, 100),
  };
}
