export function calculateEnding(resources: {
  energy: number;
  oxygen: number;
  shielding: number;
}): 'good' | 'medium' | 'bad' {
  const avg = (resources.energy + resources.oxygen + resources.shielding) / 3;
  if (avg > 30) return 'good';
  if (avg >= 10) return 'medium';
  return 'bad';
}
