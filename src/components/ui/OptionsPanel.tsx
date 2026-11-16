import { useEffect, useId, useRef } from 'react';
import './GameMenus.css';
import { useSettingsStore, VOLUME_LEVELS, type TextSize, type TextSpeed } from '../../stores/useSettingsStore';
import { speak, speechSupported, toggleReadScreen, useSpeaking } from '../../utils/speech';
import { playChoiceSound } from '../../utils/sounds';
import { MenuIcon, type MenuIconName } from './MenuIcon';

interface Choice<T> {
  label: string;
  value: T;
}

/** A row of big pill buttons that works like radio buttons (native inputs: keyboard and screen readers for free). */
function Segmented<T extends string | number | boolean>({
  title,
  hint,
  choices,
  value,
  onChange,
  icon,
}: {
  title: string;
  hint?: string;
  choices: readonly Choice<T>[];
  value: T;
  onChange: (v: T) => void;
  icon: MenuIconName;
}) {
  const name = useId();
  return (
    <fieldset className="opt-row">
      <legend className="opt-row__title"><MenuIcon name={icon} size={18} /> <span>{title}</span></legend>
      {hint && <p className="opt-row__hint">{hint}</p>}
      <div className="opt-seg">
        {choices.map((c) => (
          <label key={String(c.value)} className={`opt-seg__item ${c.value === value ? 'is-on' : ''}`}>
            <input type="radio" name={name} checked={c.value === value} onChange={() => onChange(c.value)} />
            <span>{c.label}</span>
            <span className="opt-seg__check"><MenuIcon name="check" size={16} /></span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const SIZES: readonly Choice<TextSize>[] = [
  { label: 'Normal', value: 'normal' },
  { label: 'Big', value: 'big' },
];

const SPEEDS: readonly Choice<TextSpeed>[] = [
  { label: 'Slow', value: 'slow' },
  { label: 'Normal', value: 'normal' },
  { label: 'All at once', value: 'instant' },
];

const ON_OFF: readonly Choice<boolean>[] = [
  { label: 'Off', value: false },
  { label: 'On', value: true },
];

/** Central Settings panel: accessibility, narration and audio in one place. */
export function OptionsPanel() {
  const { textSize, textSpeed, readAloud, volume, musicVolume, effectsVolume, uiVolume, set } = useSettingsStore();
  const speaking = useSpeaking((s) => s.speaking);

  return (
    <div className="opt-panel">
      <section className="opt-section" aria-labelledby="opt-accessibility-title">
        <h3 className="opt-section__title" id="opt-accessibility-title"><MenuIcon name="accessibility" /> <span>Accessibility</span></h3>
        <Segmented icon="text" title="Text size" choices={SIZES} value={textSize} onChange={(v) => set({ textSize: v })} />
        <Segmented
          icon="speed"
          title="Text speed"
          hint="How fast the messages appear."
          choices={SPEEDS}
          value={textSpeed}
          onChange={(v) => set({ textSpeed: v })}
        />
        {speechSupported && (
          <>
            <Segmented
              icon="narration"
              title="Automatic narration"
              hint="A voice reads new mission messages as they appear."
              choices={ON_OFF}
              value={readAloud}
              onChange={(v) => {
                set({ readAloud: v });
                if (v) speak('I will read the messages for you.');
              }}
            />
            <button type="button" className="opt-read-btn" onClick={toggleReadScreen}>
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
                {speaking ? <path d="M16 9l5 6M21 9l-5 6" /> : <path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />}
              </svg>
              {speaking ? 'Stop reading' : 'Read this screen'}
              <kbd className="gm-kbd">L</kbd>
            </button>
          </>
        )}
      </section>
      <section className="opt-section" aria-labelledby="opt-audio-title">
        <h3 className="opt-section__title" id="opt-audio-title"><MenuIcon name="audio" /> <span>Audio</span></h3>
        <Segmented
          icon="volume"
          title="Master volume"
          choices={VOLUME_LEVELS}
          value={volume}
          onChange={(v) => {
            set({ volume: v });
            playChoiceSound();
          }}
        />
        <Segmented
          icon="music"
          title="Background music"
          hint="A calm station ambience."
          choices={VOLUME_LEVELS}
          value={musicVolume}
          onChange={(v) => set({ musicVolume: v })}
        />
        <Segmented
          icon="effects"
          title="World sounds"
          hint="Footsteps, robot and mission alerts."
          choices={VOLUME_LEVELS}
          value={effectsVolume}
          onChange={(v) => {
            set({ effectsVolume: v });
            playChoiceSound('effects');
          }}
        />
        <Segmented
          icon="ui"
          title="Interface sounds"
          hint="Choices and message ticks."
          choices={VOLUME_LEVELS}
          value={uiVolume}
          onChange={(v) => {
            set({ uiVolume: v });
            playChoiceSound();
          }}
        />
      </section>
      <p className="opt-note">Your choices are saved on this computer.</p>
    </div>
  );
}

/** Options as its own window (title screen). Esc or "Done" closes it. */
export function OptionsDialog({ onClose }: { onClose: () => void }) {
  const doneRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    doneRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div
      className="gm-backdrop gm-backdrop--top"
      role="dialog"
      aria-modal="true"
      aria-labelledby="opt-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="gm-card gm-card--options">
        <h2 id="opt-title" className="gm-title gm-title--icon">
          <MenuIcon name="settings" />
          Settings
        </h2>
        <OptionsPanel />
        <button ref={doneRef} type="button" className="gm-btn gm-btn--primary gm-btn--wide" onClick={onClose}>
          <MenuIcon name="check" /> Done <kbd className="gm-kbd">Esc</kbd>
        </button>
      </div>
    </div>
  );
}
