import { useEffect, useRef, useState } from 'react';
import { elementText, speak, speechSupported, toggleReadScreen } from '../../utils/speech';
import { useSettingsStore } from '../../stores/useSettingsStore';
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

const AUTO_READ_SELECTOR = '[data-voice-options], [data-voice-story]';

/** Reads newly displayed choices and story content when automatic narration is enabled. */
export function useAutomaticOptionReader() {
  const readAloud = useSettingsStore((s) => s.readAloud);
  const initialized = useRef(false);

  useEffect(() => {
    const firstRun = !initialized.current;
    initialized.current = true;
    if (!speechSupported || !readAloud) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const outermost = (roots: Element[]) =>
      roots.filter((root, index) => roots.indexOf(root) === index && !roots.some((other) => other !== root && other.contains(root)));

    const read = (roots: Element[]) => {
      const visibleRoots = outermost(roots);
      if (!visibleRoots.length) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const text = visibleRoots.map(elementText).filter(Boolean).join(' ');
        if (!text) return;
        const hasOptions = visibleRoots.some((root) => root.hasAttribute('data-voice-options'));
        const hasStory = visibleRoots.some((root) => root.hasAttribute('data-voice-story'));
        const introduction = hasOptions && hasStory
          ? 'New story content and available options.'
          : hasOptions
            ? 'Available options.'
            : 'New story content.';
        speak(`${introduction} ${text}`);
      }, 80);
    };

    // Also covers a saved setting that was already on when the game loaded. When the user
    // enables narration in Settings, do not talk over that dialog with options behind it.
    if (firstRun) read([...document.querySelectorAll(AUTO_READ_SELECTOR)]);

    const observer = new MutationObserver((mutations) => {
      const added: Element[] = [];
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches(AUTO_READ_SELECTOR)) added.push(node);
          added.push(...node.querySelectorAll(AUTO_READ_SELECTOR));
        }
      }
      read(added);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [readAloud]);
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
