import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'pt' | 'es';
export const LANGUAGE_LOCALES: Record<Language, string> = { en: 'en-US', pt: 'pt-BR', es: 'es-ES' };
export const useLanguage = create<{ language: Language; setLanguage: (language: Language) => void }>()(
  persist((set) => ({ language: 'en', setLanguage: (language) => set({ language }) }), {
    name: 'aurora-language',
    merge: (saved, current) => {
      const candidate = (saved as { language?: string } | null)?.language;
      return { ...current, language: candidate === 'pt' || candidate === 'es' ? candidate : 'en' };
    },
  }),
);
