/**
 * Inline vector icons for the HUD.
 * TODO: replace with real asset — UI-001..004, UI-020 in assets/ASSET_CATALOG.md
 */
interface IconProps {
  size?: number;
}

export function EnergyIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.5 2 4.5 13.5h6L9.5 22l10-12.5h-6.2L13.5 2Z" fill="currentColor" />
    </svg>
  );
}

export function OxygenIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <path
        d="M16 13.2c0-1 .8-1.7 1.9-1.7 1 0 1.8.6 1.8 1.5 0 .7-.4 1.2-1.1 1.8L16 17h3.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Apple: station food supply. */
export function FoodIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 7.2c-1.4-1-3.4-1.3-5-.5C4.4 8 3.6 11.4 4.6 14.6 5.6 18 8 21 10 21c.9 0 1.3-.5 2-.5s1.1.5 2 .5c2 0 4.4-3 5.4-6.4 1-3.2.2-6.6-2.4-7.9-1.6-.8-3.6-.5-5 .5Z"
        fill="currentColor"
      />
      <path d="M12 7.5c0-2 .8-3.6 2.4-4.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Water drop. */
export function WaterIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5S5 10.2 5 14.7A7 7 0 0 0 19 14.7C19 10.2 12 2.5 12 2.5Z" fill="currentColor" />
      <path d="M9 15.2a3.2 3.2 0 0 0 2.6 3" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Radiation trefoil (the warning symbol kids see on real equipment). */
export function RadiationIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      <path d="M8.40 12.00L2.00 12.00A10 10 0 0 1 7.00 3.34L10.20 8.88A3.6 3.6 0 0 0 8.40 12.00Z M13.80 8.88L17.00 3.34A10 10 0 0 1 22.00 12.00L15.60 12.00A3.6 3.6 0 0 0 13.80 8.88Z M13.80 15.12L17.00 20.66A10 10 0 0 1 7.00 20.66L10.20 15.12A3.6 3.6 0 0 0 13.80 15.12Z" fill="currentColor" />
    </svg>
  );
}

export function HeartIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s-7.5-4.6-9.3-9.4C1.4 8 3.6 4.5 7.1 4.5c2 0 3.6 1.1 4.9 2.8 1.3-1.7 2.9-2.8 4.9-2.8 3.5 0 5.7 3.5 4.4 7.1C19.5 16.4 12 21 12 21Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SmileIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="9" cy="10" r="1.4" fill="currentColor" />
      <circle cx="15" cy="10" r="1.4" fill="currentColor" />
      <path d="M8 14.2c1 1.6 2.4 2.4 4 2.4s3-.8 4-2.4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function MapIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 5.5 8.5 3l7 2.5 6-2.5v15.5l-6 2.5-7-2.5-6 2.5Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8.5 3v15.5M15.5 5.5V21" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function PinIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.6A2.6 2.6 0 1 1 12 6.4a2.6 2.6 0 0 1 0 5.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Astronaut helmet bust used as the commander portrait. TODO: replace with real asset — CHR-011 */
export function CommanderPortrait({ size = 64 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id="hud-portrait-bg" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#24345e" />
          <stop offset="100%" stopColor="#0a0e27" />
        </radialGradient>
        <linearGradient id="hud-visor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7fe0ff" />
          <stop offset="55%" stopColor="#2a7fb8" />
          <stop offset="100%" stopColor="#123a66" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" fill="url(#hud-portrait-bg)" />
      {/* suit shoulders */}
      <path d="M8 64c1-11 10-17 24-17s23 6 24 17Z" fill="#e8e2d6" />
      <path d="M24 50h16v5H24z" fill="#f5a623" />
      {/* helmet */}
      <circle cx="32" cy="29" r="17" fill="#f0ece4" />
      <circle cx="32" cy="29" r="17" fill="none" stroke="#b9b0a2" strokeWidth="1.5" />
      <rect x="19" y="20" width="26" height="18" rx="9" fill="url(#hud-visor)" />
      <path d="M23 24c2-2 5-2.6 8-2.4" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
