import { t as localize } from '../../i18n/translate';
import { useGameStore } from '../../stores/useGameStore';
import { ProgressBar } from '../ui/ProgressBar';
import { ACT_1_LAST_DAY, ACT_2_LAST_DAY, MISSION_DAYS } from '../../data/missionLength';

function getAct(day: number): { act: 1 | 2 | 3; label: string } {
  if (day <= ACT_1_LAST_DAY) return { act: 1, label: 'Act 1: All Systems Go' };
  if (day <= ACT_2_LAST_DAY) return { act: 2, label: 'Act 2: Things Get Complicated' };
  return { act: 3, label: 'Act 3: Survive' };
}

export function DayTracker() {
  const day = useGameStore((s) => s.day);
  const { label } = getAct(day);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      <h3 style={{ fontSize: 'var(--font-size-sm)' }}>{localize("Mission Progress")}</h3>
      <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, textAlign: 'center' }}>{localize(" Day ")}{localize(day)} / {localize(MISSION_DAYS)}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--accent-amber)', textAlign: 'center' }}>
        {localize(label)}
      </div>
      <ProgressBar value={day} max={MISSION_DAYS} color="var(--accent-blue)" size="sm" showValue={false} />
    </div>
  );
}

export { getAct };
