import { useResourceStore } from '../../stores/useResourceStore';
import { ProgressBar } from '../ui/ProgressBar';

export function ResourcePanel() {
  const energy = useResourceStore((s) => s.energy);
  const oxygen = useResourceStore((s) => s.oxygen);
  const shielding = useResourceStore((s) => s.shielding);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>Resources</h3>
      <ProgressBar icon="⚡" label="Energy" value={energy} color="var(--accent-amber)" size="sm" />
      <ProgressBar icon="🫁" label="Oxygen" value={oxygen} color="var(--accent-blue)" size="sm" />
      <ProgressBar icon="🛡️" label="Shielding" value={shielding} color="var(--accent-purple)" size="sm" />
    </div>
  );
}
