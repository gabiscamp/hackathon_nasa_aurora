import { useCallback, useEffect, useRef, useState } from 'react';
import { gameEvents, EVENTS } from '../../game/events';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import '../ui/GameMenus.css';

interface PauseMenuProps {
  onMainMenu: () => void;
  onOpenCredits: () => void;
  /** true while another overlay (credits) owns the keyboard. */
  suspended: boolean;
}

type View = 'menu' | 'help';

const CONTROLS: { keys: string[]; action: string }[] = [
  { keys: ['W', 'A', 'S', 'D'], action: 'Walk (arrow keys work too)' },
  { keys: ['E'], action: 'Talk or use things' },
  { keys: ['1', '2', '3', '4', '5'], action: 'Pick an inventory slot' },
  { keys: ['Esc'], action: 'Open or close this menu' },
];

/**
 * In-game menu: a visible "Menu" button + Esc / P (Nielsen: user control and freedom,
 * flexibility and efficiency). Pauses the Phaser world while open.
 */
export function PauseMenu({ onMainMenu, onOpenCredits, suspended }: PauseMenuProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('menu');
  const [confirmHome, setConfirmHome] = useState(false);
  const resumeRef = useRef<HTMLButtonElement>(null);

  // Tracks whether this menu currently holds the world paused, so OPENED/CLOSED always come in pairs.
  const pausingRef = useRef(false);

  const openMenu = useCallback(() => {
    setView('menu');
    setOpen(true);
    if (!pausingRef.current) {
      pausingRef.current = true;
      gameEvents.emit(EVENTS.MENU_OPENED);
    }
  }, []);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setConfirmHome(false);
    if (pausingRef.current) {
      pausingRef.current = false;
      gameEvents.emit(EVENTS.MENU_CLOSED);
    }
  }, []);

  useEffect(() => {
    if (suspended || confirmHome) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' && e.key.toLowerCase() !== 'p') return;
      if (!open) openMenu();
      else if (view === 'help') setView('menu');
      else closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, view, suspended, confirmHome, openMenu, closeMenu]);

  useEffect(() => {
    if (open && view === 'menu') resumeRef.current?.focus();
  }, [open, view]);

  // Leaving the game screen with the menu open must not leave the world paused.
  useEffect(
    () => () => {
      if (pausingRef.current) {
        pausingRef.current = false;
        gameEvents.emit(EVENTS.MENU_CLOSED);
      }
    },
    [],
  );

  return (
    <>
      <button type="button" className="gm-menu-btn" onClick={openMenu} aria-haspopup="dialog">
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        Menu
        <kbd className="gm-kbd">Esc</kbd>
      </button>

      {open && (
        <div className="gm-backdrop" role="dialog" aria-modal="true" aria-labelledby="gm-pause-title">
          <div className="gm-card">
            {view === 'menu' ? (
              <>
                <h2 id="gm-pause-title" className="gm-title">Game paused</h2>
                <p className="gm-text">The station is waiting for you, Commander.</p>
                <div className="gm-list">
                  <button ref={resumeRef} type="button" className="gm-btn gm-btn--primary gm-btn--wide" onClick={closeMenu}>
                    Back to the game <kbd className="gm-kbd">Esc</kbd>
                  </button>
                  <button type="button" className="gm-btn gm-btn--wide" onClick={() => setView('help')}>
                    How to play
                  </button>
                  <button type="button" className="gm-btn gm-btn--wide" onClick={onOpenCredits}>
                    Credits &amp; NASA sources
                  </button>
                  <button type="button" className="gm-btn gm-btn--wide" onClick={() => setConfirmHome(true)}>
                    Main menu
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="gm-pause-title" className="gm-title">How to play</h2>
                <ul className="gm-controls">
                  {CONTROLS.map((c) => (
                    <li key={c.action}>
                      <span className="gm-controls__keys">
                        {c.keys.map((k) => (
                          <kbd key={k} className="gm-kbd">{k}</kbd>
                        ))}
                      </span>
                      {c.action}
                    </li>
                  ))}
                </ul>
                <button type="button" className="gm-btn gm-btn--wide" onClick={() => setView('menu')}>
                  Back
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {confirmHome && (
        <ConfirmDialog
          title="Go to the main menu?"
          message="Your mission is saved. You can continue it from the main menu."
          confirmLabel="Go to main menu"
          onCancel={() => setConfirmHome(false)}
          onConfirm={() => {
            closeMenu();
            onMainMenu();
          }}
        />
      )}
    </>
  );
}
