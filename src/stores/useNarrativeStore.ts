import { create } from 'zustand';

interface NarrativeState {
  dialogues: string[];
  currentDialogue: string | null;
  alerts: string[];

  pushDialogue: (text: string) => void;
  advance: () => void;
  pushAlert: (text: string) => void;
  clearAlert: () => void;
  clearAll: () => void;
}

export const useNarrativeStore = create<NarrativeState>()((set) => ({
  dialogues: [],
  currentDialogue: null,
  alerts: [],

  pushDialogue: (text) =>
    set((state) => {
      if (state.currentDialogue === null) {
        return { currentDialogue: text };
      }
      return { dialogues: [...state.dialogues, text] };
    }),

  advance: () =>
    set((state) => {
      if (state.dialogues.length === 0) {
        return { currentDialogue: null };
      }
      const [next, ...rest] = state.dialogues;
      return { currentDialogue: next, dialogues: rest };
    }),

  pushAlert: (text) =>
    set((state) => ({ alerts: [...state.alerts, text] })),

  clearAlert: () =>
    set((state) => ({ alerts: state.alerts.slice(1) })),

  clearAll: () =>
    set({ dialogues: [], currentDialogue: null, alerts: [] }),
}));
