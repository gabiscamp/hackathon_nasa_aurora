import { useEffect } from 'react';
import { LANGUAGE_LOCALES, useLanguage } from '../../i18n/language';
import { stopSpeaking } from '../../utils/speech';
import './LanguageSwitcher.css';

const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'pt', label: 'PT', name: 'Português' },
  { code: 'es', label: 'ES', name: 'Español' },
] as const;

export function LanguageSwitcher() {
  const language = useLanguage((s) => s.language);
  const setLanguage = useLanguage((s) => s.setLanguage);
  useEffect(() => {
    document.documentElement.lang = LANGUAGE_LOCALES[language];
    document.title = { en: 'Aurora Station — Mars Orbit Mission', pt: 'Aurora Station — Missão em órbita de Marte', es: 'Aurora Station — Misión en órbita de Marte' }[language];
  }, [language]);
  return <nav className="language-switcher" aria-label="Language / Idioma" data-typing-pass>
    {LANGUAGES.map(({ code, label, name }) => <button key={code} type="button" lang={LANGUAGE_LOCALES[code]}
      aria-label={name} title={name} aria-pressed={language === code} onClick={() => { stopSpeaking(); setLanguage(code); }}>
      {label}
    </button>)}
  </nav>;
}
