import { useEffect, useState } from 'react';
import { speechSupported, toggleReadScreen, useSpeaking } from '../../utils/speech';
import { OptionsDialog } from './OptionsPanel';
import './GameMenus.css';

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      {on ? <path d="M16 9l5 6M21 9l-5 6" /> : <path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />}
    </svg>
  );
}

export function GearIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" />
    </svg>
  );
}

/** "Read" button: reads the current screen aloud (or stops). Same as the L key. */
export function ReadButton({ className = 'gm-menu-btn' }: { className?: string }) {
  const speaking = useSpeaking((s) => s.speaking);
  if (!speechSupported) return null;
  return (
    <button
      type="button"
      className={`${className} a11y-btn`}
      onClick={toggleReadScreen}
      aria-label={speaking ? 'Stop reading (L)' : 'Read this screen aloud (L)'}
    >
      <SpeakerIcon on={speaking} />
      <span className="a11y-btn__text">{speaking ? 'Stop' : 'Read'}</span>
      <kbd className="gm-kbd">L</kbd>
    </button>
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
 * Read + Options, pinned to the top centre of the story screens (briefing, crew, ending),
 * so the accessibility options are one click away on every screen.
 */
export function A11yDock() {
  const [optionsOpen, setOptionsOpen] = useState(false);
  return (
    <>
      <div className="a11y-dock" role="group" aria-label="Accessibility">
        <ReadButton />
        <button type="button" className="gm-menu-btn a11y-btn" onClick={() => setOptionsOpen(true)}>
          <GearIcon />
          <span className="a11y-btn__text">Options</span>
        </button>
      </div>
      {optionsOpen && <OptionsDialog onClose={() => setOptionsOpen(false)} />}
    </>
  );
}
