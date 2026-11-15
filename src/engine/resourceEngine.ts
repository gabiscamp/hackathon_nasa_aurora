import type { Choice } from '../data/missions';
import { RESOURCE_KEYS, type Resources } from '../stores/useResourceStore';

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
  const delta: Partial<Resources> = {};
  for (const key of RESOURCE_KEYS) {
    const value = consequences[key];
    if (value !== undefined) delta[key] = value;
  }

  if (Object.keys(delta).length > 0) {
    resourceStore.applyDelta(delta);
  }

  if (consequences.crewEffects) {
    for (const effect of consequences.crewEffects) {
      crewStore.updateCrew(effect.id, {
        ...(effect.health !== undefined && { health: effect.health }),
        ...(effect.morale !== undefined && { morale: effect.morale }),
      });
    }
  }
}
