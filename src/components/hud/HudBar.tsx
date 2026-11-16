import { t as localize } from '../../i18n/translate';
import type { ReactNode } from 'react';

export const LOW_THRESHOLD = 25;

/** true when the bar is in the danger zone (low, or high for "higherIsWorse" bars). */
export function isDanger(value: number, higherIsWorse = false, max = 100): boolean {
  const pct = (value / max) * 100;
  return higherIsWorse ? pct > 100 - LOW_THRESHOLD : pct < LOW_THRESHOLD;
}

interface HudBarProps {
  icon: ReactNode;
  label: string;
  value: number;
  max?: number;
  /** CSS color for the filled part of the bar. */
  color: string;
  /** true when a FULL bar is bad (radiation): the warning fires when it gets high, not low. */
  higherIsWorse?: boolean;
}

/** Game-style resource bar: round icon badge + name, gauge and number side by side on the dark panel (never color-only, never text over the fill). */
export function HudBar({ icon, label, value, max = 100, color, higherIsWorse = false }: HudBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const isLow = isDanger(value, higherIsWorse, max);

  return (
    <div
      className={`hud-bar ${isLow ? 'hud-bar--low' : ''}`}
      style={{ ['--bar-color' as string]: isLow ? 'var(--hud-red)' : color }}
      role="meter"
      aria-label={localize(label)}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      title={localize(`${label}: ${Math.round(value)}`)}
    >
      <span className="hud-bar__badge">{localize(icon)}</span>
      <span className="hud-bar__label">{localize(label)}</span>
      <span className="hud-bar__track" aria-hidden="true">
        <span className="hud-bar__fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="hud-bar__value">{localize(Math.round(value))}<small>%</small></span>
    </div>
  );
}
