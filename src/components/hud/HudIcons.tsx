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

export function ShieldIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 4 5v6.2c0 5 3.4 9.2 8 10.8 4.6-1.6 8-5.8 8-10.8V5l-8-3Z" fill="currentColor" />
      <path d="M12 5.2v13.6c-3-1.4-5-4.3-5-7.6V7.1l5-1.9Z" fill="rgba(255,255,255,0.28)" />
    </svg>
  );
}

export function AlertIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="10.4" y="4" width="3.2" height="10.5" rx="1.6" fill="currentColor" />
      <circle cx="12" cy="18.6" r="2" fill="currentColor" />
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
