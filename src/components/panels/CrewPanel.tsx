import { t as localize } from '../../i18n/translate';
import { useCrewStore } from '../../stores/useCrewStore';
import { useGameStore } from '../../stores/useGameStore';
import { ProgressBar } from '../ui/ProgressBar';

const ROLE_EMOJI: Record<string, string> = {
  engineer: '🔧',
  medic: '🩺',
  scientist: '🔬',
  commander: '🎖️',
};

export function CrewPanel() {
  const crew = useCrewStore((s) => s.crew);
  const playerName = useGameStore((s) => s.playerName);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <h3 style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-xs)' }}>{localize("Crew")}</h3>

      {/* Commander (player) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <span style={{ fontSize: '1.5rem' }}>🎖️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>
            {localize(playerName || 'Commander')}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{localize("Commander")}</div>
        </div>
      </div>

      {/* Crew members */}
      {localize(Object.values(crew).map((member) => (
        <div key={member.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
          <span style={{ fontSize: '1.5rem' }}>{localize(ROLE_EMOJI[member.role] ?? '👤')}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>
              {localize(member.name.split(' ')[0])}
            </div>
            <ProgressBar value={member.health} color="var(--accent-red)" size="sm" showValue={false} />
            <ProgressBar value={member.morale} color="var(--accent-green)" size="sm" showValue={false} />
          </div>
        </div>
      )))}
    </div>
  );
}
