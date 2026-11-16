import { t as localize } from '../../i18n/translate';
import type { ReactNode } from 'react';

export type MenuIconName =
  | 'accessibility'
  | 'audio'
  | 'back'
  | 'book'
  | 'check'
  | 'controls'
  | 'credits'
  | 'effects'
  | 'help'
  | 'home'
  | 'mission'
  | 'music'
  | 'narration'
  | 'pause'
  | 'play'
  | 'resources'
  | 'settings'
  | 'speed'
  | 'text'
  | 'ui'
  | 'volume'
  | 'warning';

/** Consistent outline icons for menus. Labels remain visible, so icons never carry meaning alone. */
export function MenuIcon({ name, size = 22 }: { name: MenuIconName; size?: number }) {
  const paths: Record<MenuIconName, ReactNode> = {
    accessibility: <><circle cx="12" cy="4.5" r="2" /><path d="M5 8.5h14M12 7v14M8 21l4-7 4 7" /></>,
    audio: <><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /></>,
    back: <path d="M19 12H5m6-6-6 6 6 6" />,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z" /></>,
    check: <path d="m5 12.5 4.5 4.5L19 7" />,
    controls: <><path d="M8 8h8a5 5 0 0 1 4.8 6.4l-.8 2.8a2.5 2.5 0 0 1-4.1 1.1L13.5 16h-3l-2.4 2.3A2.5 2.5 0 0 1 4 17.2l-.8-2.8A5 5 0 0 1 8 8Z" /><path d="M7 12v4M5 14h4M16.5 12.5h.01M18.5 14.5h.01" /></>,
    credits: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2.5" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M14 20a4 4 0 0 1 7 0" /></>,
    effects: <><path d="m13 2-2 7H5l5 4-2 9 7-11h5l-4-4 1-5z" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.5 2.5 0 1 1 3.2 2.4c-.9.4-.9 1-.9 2M12 17.5h.01" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5.5 9.5V21h13V9.5M9.5 21v-7h5v7" /></>,
    mission: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="m15 9 5-5M16 4h4v4" /></>,
    music: <><path d="M9 18V5l10-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></>,
    narration: <><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M16 9a4 4 0 0 1 0 6M19 7a7 7 0 0 1 0 10" /></>,
    pause: <><circle cx="12" cy="12" r="9" /><path d="M9.5 8.5v7M14.5 8.5v7" /></>,
    play: <><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4z" /></>,
    resources: <><path d="M5 5h14v14H5z" /><path d="M8 15v-3M12 15V8M16 15v-5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" /></>,
    speed: <><path d="M4 14a8 8 0 1 1 16 0" /><path d="m12 14 4-4M7 18h10" /></>,
    text: <><path d="M5 5h14M12 5v14M8 19h8" /></>,
    ui: <><path d="M4 4h16v16H4z" /><path d="M4 9h16M8 6.5h.01M11 6.5h.01M14 6.5h.01" /></>,
    volume: <><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M16 9a4 4 0 0 1 0 6" /></>,
    warning: <><path d="M12 3 2.8 20h18.4z" /><path d="M12 9v5M12 17.5h.01" /></>,
  };

  return (
    <svg className="menu-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {localize(paths[name])}
    </svg>
  );
}
