import { useResourceStore, type Resources } from '../../stores/useResourceStore';
import { useGameStore } from '../../stores/useGameStore';
import { Button } from '../ui/Button';

function Delta({ label, before, after, higherIsWorse = false }: { label: string; before: number; after: number; higherIsWorse?: boolean }) {
  const diff = after - before;
  const good = higherIsWorse ? diff < 0 : diff > 0;
  const color = diff === 0 ? 'var(--text-secondary)' : good ? 'var(--accent-green)' : 'var(--accent-red)';
  const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '—';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
      <span>{label}</span>
      <span style={{ color, fontWeight: 700 }}>
        {arrow} {Number(Math.abs(diff).toFixed(1))}  ({Number(after.toFixed(1))})
      </span>
    </div>
  );
}

export function DaySummary({ before, onNextDay }: { before: Resources; onNextDay: () => void }) {
  const food = useResourceStore((s) => s.food);
  const water = useResourceStore((s) => s.water);
  const oxygen = useResourceStore((s) => s.oxygen);
  const radiation = useResourceStore((s) => s.radiation);
  const energy = useResourceStore((s) => s.energy);
  const health = useResourceStore((s) => s.health);
  const satisfaction = useResourceStore((s) => s.satisfaction);
  const day = useGameStore((s) => s.day);

  return (
    <div
      className="panel"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(360px, calc(100% - 32px))',
        maxWidth: '480px',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <h2 style={{ textAlign: 'center', fontSize: 'var(--text-xl)', margin: 0, color: 'var(--text-primary)' }}>Day {day} Complete</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <Delta label="🍎 Food" before={before.food} after={food} />
        <Delta label="💧 Water" before={before.water} after={water} />
        <Delta label="🫁 Oxygen" before={before.oxygen} after={oxygen} />
        <Delta label="☢️ Radiation" before={before.radiation} after={radiation} higherIsWorse />
        <Delta label="⚡ Energy" before={before.energy} after={energy} />
        <Delta label="❤️ Health" before={before.health} after={health} />
        <Delta label="😊 Satisfaction" before={before.satisfaction} after={satisfaction} />
      </div>

      <Button variant="primary" onClick={onNextDay} icon="🌅">
        Next Day
      </Button>
    </div>
  );
}
