import { t as localize } from '../../i18n/translate';
import { useMissionStore } from '../../stores/useMissionStore';

export function MissionPanel() {
  const mission = useMissionStore((s) => s.currentMission);

  if (!mission) return null;

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <span style={{ fontSize: '2rem' }}>{localize(mission.icon)}</span>
        <h3 style={{ fontSize: 'var(--font-size-lg)' }}>{localize(mission.title)}</h3>
      </div>
      <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 'var(--font-size-sm)' }}>
        {localize(mission.description)}
      </p>
    </div>
  );
}
