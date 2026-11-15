import type { ReactNode } from 'react';

const LOW_THRESHOLD = 25;

interface HudBarProps {
  icon: ReactNode;
  label: string;
  value: number;
  max?: number;
  /** CSS color for the filled part of the bar. */
  color: string;
}

/** Game-style resource bar: round icon badge + capsule gauge with the value inside. */
export function HudBar({ icon, label, value, max = 100, color }: HudBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const isLow = pct < LOW_THRESHOLD;

  return (
    <div
      className={`hud-bar ${isLow ? 'hud-bar--low' : ''}`}
      style={{ ['--bar-color' as string]: isLow ? 'var(--hud-red)' : color }}
      role="meter"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      title={`${label}: ${Math.round(value)}`}
    >
      <span className="hud-bar__badge">{icon}</span>
      <span className="hud-bar__track">
        <span className="hud-bar__fill" style={{ width: `${pct}%` }} />
        <span className="hud-bar__value">{Math.round(value)}</span>
      </span>
    </div>
  );
}
