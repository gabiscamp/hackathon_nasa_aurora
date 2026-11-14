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
      {(icon || label) && (
        <div className="progress-label">
          {icon && <span className="progress-icon">{icon}</span>}
          {label && <span className="progress-text">{label}</span>}
        </div>
      )}
      <div className="progress-track">
        <div
          className={`progress-fill ${isLow ? 'progress-low' : ''} ${isCritical ? 'progress-critical' : ''}`}
          style={{
            width: `${percentage}%`,
            backgroundColor: isCritical ? 'var(--accent-red)' : isLow ? 'var(--accent-amber)' : color,
          }}
        />
      </div>
      {showValue && (
        <span className={`progress-value ${isCritical ? 'text-critical' : ''}`}>
          {Math.round(value)}
        </span>
      )}
    </div>
  );
}
