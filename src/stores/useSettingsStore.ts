import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TextSize = 'normal' | 'big';
export type TextSpeed = 'slow' | 'normal' | 'instant';

/** Sound levels a kid can pick; 1 = the game's original loudness. */
export const VOLUME_LEVELS: readonly { label: string; value: number }[] = [
  { label: 'Off', value: 0 },
  { label: 'Narration-friendly (10%)', value: 0.1 },
  { label: 'Low', value: 0.5 },
  { label: 'Normal', value: 1 },
  { label: 'High', value: 1.6 },
];

interface SettingsState {
  textSize: TextSize;
  textSpeed: TextSpeed;
  /** A voice reads mission and dialogue text (browser speech, no internet needed). */
  readAloud: boolean;
  volume: number;
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void;
}

/** Accessibility options (Menu → Options). Saved in this browser. */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      textSize: 'normal',
      textSpeed: 'normal',
      readAloud: false,
      volume: 1,
      set: (patch) => set(patch),
    }),
    { name: 'aurora-settings', version: 1 },
  ),
);

/** Delay multiplier for the letter-by-letter text. */
export function textSpeedFactor(speed: TextSpeed): number {
  return speed === 'slow' ? 2.2 : 1;
}

/** "Big text" is a page-wide switch read by CSS (html[data-text-size="big"] in global.css). */
function applyTextSize(size: TextSize) {
  if (typeof document !== 'undefined') document.documentElement.dataset.textSize = size;
}
applyTextSize(useSettingsStore.getState().textSize);
useSettingsStore.subscribe((s) => applyTextSize(s.textSize));
