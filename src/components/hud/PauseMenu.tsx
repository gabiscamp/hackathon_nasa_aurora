import { useCallback, useEffect, useRef, useState } from 'react';
import { gameEvents, EVENTS } from '../../game/events';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { HowToPlay } from './HowToPlay';
import { OptionsPanel } from '../ui/OptionsPanel';
import { GearIcon } from '../ui/A11yDock';
import '../ui/GameMenus.css';

interface PauseMenuProps {
  onMainMenu: () => void;
  onOpenCredits: () => void;
  /** true while another overlay (credits) owns the keyboard. */
  suspended: boolean;
}

type View = 'menu' | 'help' | 'options';

/**
 * In-game menu: visible "Menu" (Esc / P) and "Help" (H) buttons (Nielsen: user control and freedom,
 * flexibility and efficiency). Pauses the Phaser world while open.
 */
export function PauseMenu({ onMainMenu, onOpenCredits, suspended }: PauseMenuProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('menu');
  // Help/Options opened straight from their own button: "Back" returns to the game, not to the menu.
  const [direct, setDirect] = useState(false);
  const [confirmHome, setConfirmHome] = useState(false);
  const resumeRef = useRef<HTMLButtonElement>(null);

  // Tracks whether this menu currently holds the world paused, so OPENED/CLOSED always come in pairs.
  const pausingRef = useRef(false);

  const openMenu = useCallback((start: View = 'menu') => {
    setView(start);
    setDirect(start !== 'menu');
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
      const key = e.key.toLowerCase();
      if (key === 'h' && !e.repeat) {
        if (!open && !document.querySelector('[role="dialog"], [role="alertdialog"]')) openMenu('help');
        else if (open && view === 'help') closeMenu();
        return;
      }
      if (key !== 'escape' && key !== 'p') return;
      if (!open) openMenu();
      else if (view !== 'menu' && !direct) setView('menu');
      else closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, view, direct, suspended, confirmHome, openMenu, closeMenu]);

  useEffect(() => {
    if (open) resumeRef.current?.focus({ preventScroll: true });
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
      <div className="gm-top-actions">
        <button type="button" className="gm-menu-btn" onClick={() => openMenu()} aria-haspopup="dialog">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <span className="gm-action-label">Menu</span>
          <kbd className="gm-kbd">Esc</kbd>
        </button>
        <button type="button" className="gm-menu-btn" onClick={() => openMenu('help')} aria-haspopup="dialog">
          <span className="gm-help-badge" aria-hidden="true">
            ?
          </span>
          <span className="gm-action-label">Help</span>
          <kbd className="gm-kbd">H</kbd>
        </button>
        <button type="button" className="gm-menu-btn a11y-btn" onClick={() => openMenu('options')} aria-haspopup="dialog" aria-label="Settings">
          <GearIcon />
          <span className="gm-action-label">Settings</span>
        </button>
      </div>

      {open && (
        <div className="gm-backdrop" role="dialog" aria-modal="true" aria-labelledby="gm-pause-title">
          <div className={`gm-card ${view === 'help' ? 'gm-card--help' : view === 'options' ? 'gm-card--options' : ''}`}>
            {view === 'menu' ? (
              <>
                <h2 id="gm-pause-title" className="gm-title">
                  Game paused
                </h2>
                <p className="gm-text">The station is waiting for you, Commander.</p>
                <div className="gm-list">
                  <button ref={resumeRef} type="button" className="gm-btn gm-btn--primary gm-btn--wide" onClick={closeMenu}>
                    Back to the game <kbd className="gm-kbd">Esc</kbd>
                  </button>
                  <button type="button" className="gm-btn gm-btn--wide" onClick={() => setView('help')}>
                    How to play
                  </button>
                  <button type="button" className="gm-btn gm-btn--wide" onClick={() => setView('options')}>
                    Settings &amp; accessibility
                  </button>
                  <button type="button" className="gm-btn gm-btn--wide" onClick={onOpenCredits}>
                    Credits &amp; NASA sources
                  </button>
                  <button type="button" className="gm-btn gm-btn--wide" onClick={() => setConfirmHome(true)}>
                    Main menu
                  </button>
                </div>
              </>
            ) : view === 'options' ? (
              <>
                <h2 id="gm-pause-title" className="gm-title">
                  Settings
                </h2>
                <OptionsPanel />
                <button
                  ref={resumeRef}
                  type="button"
                  className="gm-btn gm-btn--primary gm-btn--wide"
                  onClick={direct ? closeMenu : () => setView('menu')}
                >
                  {direct ? 'Back to the game' : 'Back'} <kbd className="gm-kbd">Esc</kbd>
                </button>
              </>
            ) : (
              <>
                <h2 id="gm-pause-title" className="gm-title">
                  How to play
                </h2>
                <HowToPlay />
                <button
                  ref={resumeRef}
                  type="button"
                  className="gm-btn gm-btn--primary gm-btn--wide"
                  onClick={direct ? closeMenu : () => setView('menu')}
                >
                  {direct ? 'Back to the game' : 'Back'} <kbd className="gm-kbd">Esc</kbd>
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
