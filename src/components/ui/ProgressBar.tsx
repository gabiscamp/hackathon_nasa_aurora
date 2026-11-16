import { t as localize } from '../../i18n/translate';
interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  label?: string;
  icon?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  value,
  max = 100,
  color = 'var(--accent-blue)',
  label,
  icon,
  showValue = true,
  size = 'md',
}: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  const isLow = percentage < 25;
  const isCritical = percentage < 10;

  return (
    <div className={`progress-container progress-${size}`}>
      {localize((icon || label) && (
        <div className="progress-label">
          {localize(icon && <span className="progress-icon">{localize(icon)}</span>)}
          {localize(label && <span className="progress-text">{localize(label)}</span>)}
        </div>
      ))}
      <div className="progress-track">
        <div
          className={`progress-fill ${isLow ? 'progress-low' : ''} ${isCritical ? 'progress-critical' : ''}`}
          style={{
            width: `${percentage}%`,
            backgroundColor: isCritical ? 'var(--accent-red)' : isLow ? 'var(--accent-amber)' : color,
          }}
        />
      </div>
      {localize(showValue && (
        <span className={`progress-value ${isCritical ? 'text-critical' : ''}`}>
          {localize(Math.round(value))}
        </span>
      ))}
    </div>
  );
}
