import type { ResourceKey } from '../stores/useResourceStore';
import type { ChoiceEffect } from '../data/missions';

interface ResourceStore {
  applyDelta: (delta: Partial<Record<ResourceKey, number>>) => void;
}

export function applyEffects(
  resourceStore: ResourceStore,
  effects: ChoiceEffect[],
): void {
  const delta: Partial<Record<ResourceKey, number>> = {};
  for (const eff of effects) {
    delta[eff.resource] = (delta[eff.resource] ?? 0) + eff.delta;
  }
  if (Object.keys(delta).length > 0) {
    resourceStore.applyDelta(delta);
  }
}
