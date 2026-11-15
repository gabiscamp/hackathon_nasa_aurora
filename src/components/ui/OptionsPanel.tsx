import { useEffect, useId, useRef } from 'react';
import './GameMenus.css';
import { useSettingsStore, VOLUME_LEVELS, type TextSize, type TextSpeed } from '../../stores/useSettingsStore';
import { speak, speechSupported } from '../../utils/speech';
import { playChoiceSound } from '../../utils/sounds';

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
}: {
  title: string;
  hint?: string;
  choices: readonly Choice<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const name = useId();
  return (
    <fieldset className="opt-row">
      <legend className="opt-row__title">{title}</legend>
      {hint && <p className="opt-row__hint">{hint}</p>}
      <div className="opt-seg">
        {choices.map((c) => (
          <label key={String(c.value)} className={`opt-seg__item ${c.value === value ? 'is-on' : ''}`}>
            <input type="radio" name={name} checked={c.value === value} onChange={() => onChange(c.value)} />
            {c.label}
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

/** Options: text size, text speed, read aloud and sound. Used by the pause menu and the title screen. */
export function OptionsPanel() {
  const { textSize, textSpeed, readAloud, volume, set } = useSettingsStore();

  return (
    <div className="opt-panel">
      <Segmented title="Text size" choices={SIZES} value={textSize} onChange={(v) => set({ textSize: v })} />
      <Segmented
        title="Text speed"
        hint="How fast the messages appear."
        choices={SPEEDS}
        value={textSpeed}
        onChange={(v) => set({ textSpeed: v })}
      />
      {speechSupported && (
        <Segmented
          title="Read text aloud"
          hint="A voice reads the messages for you."
          choices={ON_OFF}
          value={readAloud}
          onChange={(v) => {
            set({ readAloud: v });
            if (v) speak('I will read the messages for you.');
          }}
        />
      )}
      <Segmented
        title="Sound"
        choices={VOLUME_LEVELS}
        value={volume}
        onChange={(v) => {
          set({ volume: v });
          playChoiceSound();
        }}
      />
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
    <div className="gm-backdrop gm-backdrop--top" role="dialog" aria-modal="true" aria-labelledby="opt-title">
      <div className="gm-card gm-card--options">
        <h2 id="opt-title" className="gm-title">
          Options
        </h2>
        <OptionsPanel />
        <button ref={doneRef} type="button" className="gm-btn gm-btn--primary gm-btn--wide" onClick={onClose}>
          Done <kbd className="gm-kbd">Esc</kbd>
        </button>
      </div>
    </div>
  );
}
