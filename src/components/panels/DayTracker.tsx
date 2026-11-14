import { useGameStore } from '../../stores/useGameStore';
import { ProgressBar } from '../ui/ProgressBar';

function getAct(day: number): { act: 1 | 2 | 3; label: string } {
  if (day <= 30) return { act: 1, label: 'Act 1: All Systems Go' };
  if (day <= 60) return { act: 2, label: 'Act 2: Things Get Complicated' };
  return { act: 3, label: 'Act 3: Survive' };
}

export function DayTracker() {
  const day = useGameStore((s) => s.day);
  const { label } = getAct(day);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      <h3 style={{ fontSize: 'var(--font-size-sm)' }}>Mission Progress</h3>
      <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, textAlign: 'center' }}>
        Day {day} / 90
      </div>
      <div style={{ fontSize: '12px', color: 'var(--accent-amber)', textAlign: 'center' }}>
        {label}
      </div>
      <ProgressBar value={day} max={90} color="var(--accent-blue)" size="sm" showValue={false} />
    </div>
  );
}

export { getAct };
