import { t as localize } from '../../i18n/translate';
import { useEffect } from 'react';
import './GameMenus.css';

interface ScreenNavProps {
  backLabel: string;
  onBack: () => void;
  skipLabel?: string;
  onSkip?: () => void;
}

/**
 * Back / Skip bar for the screens before the game (Nielsen: user control and freedom).
 * Esc = back. Key hints are always visible, so nobody has to remember them.
 */
export function ScreenNav({ backLabel, onBack, skipLabel, onSkip }: ScreenNavProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);

  return (
    <nav className="gm-screen-nav" aria-label={localize("Screen navigation")}>
      <button type="button" className="gm-btn gm-btn--ghost" onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        {localize(backLabel)}
        <kbd className="gm-kbd">{localize("Esc")}</kbd>
      </button>
      {localize(onSkip && skipLabel && (
        <button type="button" className="gm-btn gm-btn--ghost" onClick={onSkip}>
          {localize(skipLabel)}
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 5l7 7-7 7M13 5l7 7-7 7" />
          </svg>
        </button>
      ))}
    </nav>
  );
}
