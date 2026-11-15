import type { SeatRole } from '../../data/astronauts';

/**
 * Role icons from the team briefing: commander star, wrench, medical cross, magnifier.
 * TODO: replace with real asset — UI icon set from assets/ASSET_CATALOG.md.
 */
export function RoleIcon({ role, size = 22 }: { role: SeatRole; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true } as const;

  switch (role) {
    case 'commander':
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z" />
        </svg>
      );
    case 'engineer':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 5.5a4 4 0 0 0 5 5L12 18a2.5 2.5 0 1 1-3.5-3.5l7.5-7.5" />
          <path d="M14.5 5.5l2-2a4 4 0 0 1 4 4l-2 2" />
        </svg>
      );
    case 'medic':
      return (
        <svg {...common} fill="currentColor">
          <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />
        </svg>
      );
    case 'scientist':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <circle cx="10" cy="10" r="6" />
          <path d="M14.5 14.5L20 20" />
        </svg>
      );
  }
}
