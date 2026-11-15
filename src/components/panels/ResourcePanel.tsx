import { useResourceStore } from '../../stores/useResourceStore';
import { ProgressBar } from '../ui/ProgressBar';

export function ResourcePanel() {
  const food = useResourceStore((s) => s.food);
  const water = useResourceStore((s) => s.water);
  const oxygen = useResourceStore((s) => s.oxygen);
  const radiation = useResourceStore((s) => s.radiation);
  const energy = useResourceStore((s) => s.energy);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>Resources</h3>
      {/* TODO: replace with real asset — emoji icons (unused legacy panel; the HUD uses PlayerStatus) */}
      <ProgressBar icon="🍎" label="Food" value={food} color="var(--accent-amber)" size="sm" />
      <ProgressBar icon="💧" label="Water" value={water} color="var(--accent-blue)" size="sm" />
      <ProgressBar icon="🫁" label="Oxygen" value={oxygen} color="var(--accent-green)" size="sm" />
      <ProgressBar icon="☢️" label="Radiation" value={radiation} color="var(--accent-red)" size="sm" />
      <ProgressBar icon="⚡" label="Energy" value={energy} color="var(--accent-amber)" size="sm" />
    </div>
  );
}
