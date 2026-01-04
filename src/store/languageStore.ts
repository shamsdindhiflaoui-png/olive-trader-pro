import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'fr' | 'ar';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (fr: string, ar: string) => string;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'fr',
      setLanguage: (lang) => set({ language: lang }),
      t: (fr, ar) => get().language === 'fr' ? fr : ar,
    }),
    {
      name: 'language-storage',
    }
  )
);
