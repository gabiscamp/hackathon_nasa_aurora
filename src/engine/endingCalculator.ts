import { stationScore, type Resources } from '../stores/useResourceStore';

export function calculateEnding(resources: Resources): 'good' | 'medium' | 'bad' {
  const avg = stationScore(resources);
  if (avg > 30) return 'good';
  if (avg >= 10) return 'medium';
  return 'bad';
}
