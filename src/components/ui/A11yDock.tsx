import { useEffect, useState } from 'react';
import { speechSupported, toggleReadScreen } from '../../utils/speech';
import { OptionsDialog } from './OptionsPanel';
import './GameMenus.css';

export function GearIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" />
    </svg>
  );
}

/** Global L shortcut: read the screen aloud from anywhere (ignored while typing). */
export function useReadShortcut() {
  useEffect(() => {
    if (!speechSupported) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'l' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest('input:not([type="radio"]):not([type="checkbox"]), textarea, [contenteditable="true"]')) return;
      toggleReadScreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

/**
 * One Settings entry point on story screens. All accessibility controls live in
 * the centred Settings dialog instead of being scattered around the interface.
 */
export function A11yDock() {
  const [optionsOpen, setOptionsOpen] = useState(false);
  return (
    <>
      <nav className="a11y-dock" aria-label="Accessibility">
        <button type="button" className="gm-menu-btn a11y-btn" onClick={() => setOptionsOpen(true)} aria-haspopup="dialog">
          <GearIcon />
          <span className="a11y-btn__text">Settings</span>
        </button>
      </nav>
      {optionsOpen && <OptionsDialog onClose={() => setOptionsOpen(false)} />}
    </>
  );
}
