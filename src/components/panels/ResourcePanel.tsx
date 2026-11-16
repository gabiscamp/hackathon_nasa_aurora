import { t as localize } from '../../i18n/translate';
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
      <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>{localize("Resources")}</h3>
      {/* TODO: replace with real asset — emoji icons (unused legacy panel; the HUD uses PlayerStatus) */}
      <ProgressBar icon="🍎" label={localize("Food")} value={food} color="var(--accent-amber)" size="sm" />
      <ProgressBar icon="💧" label={localize("Water")} value={water} color="var(--accent-blue)" size="sm" />
      <ProgressBar icon="🫁" label={localize("Oxygen")} value={oxygen} color="var(--accent-green)" size="sm" />
      <ProgressBar icon="☢️" label={localize("Radiation")} value={radiation} color="var(--accent-red)" size="sm" />
      <ProgressBar icon="⚡" label={localize("Energy")} value={energy} color="var(--accent-amber)" size="sm" />
    </div>
  );
}
