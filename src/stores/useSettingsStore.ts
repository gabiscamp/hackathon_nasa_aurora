import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TextSize = 'normal' | 'big';
export type TextSpeed = 'slow' | 'normal' | 'instant';

/** Gentle, capped sound levels. No option amplifies a sound above its designed loudness. */
export const VOLUME_LEVELS: readonly { label: string; value: number }[] = [
  { label: 'Off', value: 0 },
  { label: 'Narration-friendly (10%)', value: 0.1 },
  { label: 'Low', value: 0.35 },
  { label: 'Normal', value: 0.7 },
  { label: 'Full', value: 1 },
];

interface SettingsState {
  textSize: TextSize;
  textSpeed: TextSpeed;
  /** A voice reads mission and dialogue text (browser speech, no internet needed). */
  readAloud: boolean;
  /** Master volume, multiplied by each category below. */
  volume: number;
  musicVolume: number;
  effectsVolume: number;
  uiVolume: number;
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void;
}

/** Accessibility options (Menu → Options). Saved in this browser. */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      textSize: 'normal',
      textSpeed: 'normal',
      readAloud: false,
      volume: 0.7,
      musicVolume: 0.7,
      effectsVolume: 0.7,
      uiVolume: 0.35,
      set: (patch) => set(patch),
    }),
    {
      name: 'aurora-settings',
      version: 3,
      migrate: (persistedState) => {
        const saved = persistedState as Partial<SettingsState>;
        return {
          ...saved,
          // The old menu allowed 160%; keep existing players at the new safe maximum.
          volume: Math.min(1, saved.volume ?? 0.7),
          // Version 2 shipped music on Low and UI on a value not represented in the menu.
          musicVolume: saved.musicVolume === undefined || saved.musicVolume === 0.35 ? 0.7 : saved.musicVolume,
          effectsVolume: saved.effectsVolume ?? 0.7,
          uiVolume: saved.uiVolume === undefined || saved.uiVolume === 0.5 ? 0.35 : saved.uiVolume,
        };
      },
    },
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
