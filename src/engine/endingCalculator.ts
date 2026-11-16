import { stationScore, type Resources } from '../stores/useResourceStore';
import type { Collapse } from '../stores/useMissionStore';

/** 'collapse' = game over (oxygen at 0, radiation at 100). The others: the crew made it to the end. */
export type EndingType = 'good' | 'medium' | 'bad' | 'collapse';

export function calculateEnding(resources: Resources, collapse: Collapse | null = null): EndingType {
  if (collapse) return 'collapse';
  const avg = stationScore(resources);
  if (avg > 30) return 'good';
  if (avg >= 10) return 'medium';
  return 'bad';
}
