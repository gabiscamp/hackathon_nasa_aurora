import { useResourceStore, type Resources } from '../../stores/useResourceStore';
import { useCrewStore } from '../../stores/useCrewStore';
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

export function DaySummary() {
  const food = useResourceStore((s) => s.food);
  const water = useResourceStore((s) => s.water);
  const oxygen = useResourceStore((s) => s.oxygen);
  const radiation = useResourceStore((s) => s.radiation);
  const energy = useResourceStore((s) => s.energy);
  const health = useResourceStore((s) => s.health);
  const satisfaction = useResourceStore((s) => s.satisfaction);
  const crew = useCrewStore((s) => s.crew);
  const nextDay = useGameStore((s) => s.nextDay);
  const day = useGameStore((s) => s.day);

  const [snapshot] = useState<Resources>({ food, water, oxygen, radiation, energy, health, satisfaction });

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

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-3)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)', margin: 0, color: 'var(--text-secondary)' }}>Crew Status</h3>
        {Object.values(crew).map((m) => (
          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', padding: 'var(--space-1) 0' }}>
            <span style={{ color: 'var(--text-primary)' }}>{m.name.split(' ')[0]}</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              ❤️ {Math.round(m.health)}  😊 {Math.round(m.morale)}
            </span>
          </div>
        ))}
      </div>

      <Button variant="primary" onClick={nextDay} icon="🌅">
        Next Day
      </Button>
    </div>
  );
}
