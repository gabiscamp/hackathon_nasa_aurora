import { getMission } from '../data/missions';
import type { MissionMarkerSpec } from './events';

/** The "!" markers for these open missions (unknown ids are skipped). */
export function markerSpecs(openEvents: readonly string[]): MissionMarkerSpec[] {
  return openEvents.flatMap((id) => {
    const m = getMission(id);
    return m ? [{ id: m.id, room: m.room, critical: m.severity === 'critical' }] : [];
  });
}
