import { useResourceStore, type Resources } from '../../stores/useResourceStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { CrewStatusList } from '../panels/CrewStatusList';
import { useGameStore } from '../../stores/useGameStore';
import { Button } from '../ui/Button';
import { useState } from 'react';

function Delta({ label, before, after, higherIsWorse = false }: { label: string; before: number; after: number; higherIsWorse?: boolean }) {
  const diff = after - before;
  const good = higherIsWorse ? diff < 0 : diff > 0;
  const color = diff === 0 ? 'var(--text-secondary)' : good ? 'var(--accent-green)' : 'var(--accent-red)';
  const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '—';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
      <span>{label}</span>
      <span style={{ color, fontWeight: 700 }}>
        {arrow} {Math.abs(Math.round(diff))}  ({Math.round(after)})
      </span>
    </div>
  );
}

/** End-of-day summary. `onNext` ends the day (daily consumption + next day). */
export function DaySummary({ onNext }: { onNext: () => void }) {
  const food = useResourceStore((s) => s.food);
  const water = useResourceStore((s) => s.water);
  const oxygen = useResourceStore((s) => s.oxygen);
  const radiation = useResourceStore((s) => s.radiation);
  const energy = useResourceStore((s) => s.energy);
  const health = useResourceStore((s) => s.health);
  const satisfaction = useResourceStore((s) => s.satisfaction);
  const conditions = useMissionStore((s) => s.conditions);
  const day = useGameStore((s) => s.day);

  const dayStart = useMissionStore((s) => s.dayStart);
  // Compared with the start of the day (all missions, jobs and lasting problems of today).
  const [fallback] = useState<Resources>({ food, water, oxygen, radiation, energy, health, satisfaction });
  const snapshot = dayStart ?? fallback;

  return (
    <div
      className="panel"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        minWidth: '360px',
        maxWidth: '480px',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <h2 style={{ textAlign: 'center', fontSize: 'var(--text-xl)', margin: 0, color: 'var(--text-primary)' }}>Day {day} Complete</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <Delta label="🍎 Food" before={snapshot.food} after={food} />
        <Delta label="💧 Water" before={snapshot.water} after={water} />
        <Delta label="🫁 Oxygen" before={snapshot.oxygen} after={oxygen} />
        <Delta label="☢️ Radiation" before={snapshot.radiation} after={radiation} higherIsWorse />
        <Delta label="⚡ Energy" before={snapshot.energy} after={energy} />
        <Delta label="❤️ Health" before={snapshot.health} after={health} />
        <Delta label="😊 Satisfaction" before={snapshot.satisfaction} after={satisfaction} />
      </div>

      {conditions.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-3)' }} data-read>
          <h3 style={{ fontSize: 'var(--text-sm)', margin: 0, color: 'var(--text-secondary)' }}>Station problems still going on</h3>
          <ul style={{ margin: 'var(--space-1) 0 0', paddingLeft: 20, fontSize: 'var(--text-sm)', color: '#fbbf24' }}>
            {conditions.map((c) => (
              <li key={c.id}>
                {c.label}
                {c.untilDay !== undefined ? ` (until Day ${c.untilDay})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-3)' }}>
        <CrewStatusList day={day + 1} title="Your crew tomorrow" />
      </div>

      <Button variant="primary" onClick={onNext} icon="🌅">
        Next Day
      </Button>
    </div>
  );
}
