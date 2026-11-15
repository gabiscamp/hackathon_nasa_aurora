import { stationScore, type Resources } from '../stores/useResourceStore';

export type EndingType = 'good' | 'medium' | 'bad' | 'radiation';

export function calculateEnding(resources: Resources): EndingType {
  if (resources.radiation >= 100) return 'radiation';
  const avg = stationScore(resources);
  if (avg > 30) return 'good';
  if (avg >= 10) return 'medium';
  return 'bad';
}
