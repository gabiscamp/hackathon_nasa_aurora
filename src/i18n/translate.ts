import portuguese from './locales/pt.json';
import spanish from './locales/es.json';
import { useLanguage, type Language } from './language';

const dictionaries: Record<Language, Record<string, string>> = { en: {}, pt: portuguese, es: spanish };
const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cache = new Map<string, string>();
const patterns = new Map<Language, { source: RegExp; target: string; names: string[] }[]>();
const fragments = new Map<Language, RegExp>();

function translateText(text: string): string {
  const language = useLanguage.getState().language;
  if (language === 'en' || !text.trim()) return text;
  const key = language + ':' + text;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const dictionary = dictionaries[language];
  const source = normalize(text);
  let result = dictionary[source];
  if (result === undefined) {
    let templates = patterns.get(language);
    if (!templates) {
      templates = Object.entries(dictionary).filter(([s]) => /\{\w+\}/.test(s) && s.replace(/\{\w+\}/g, '').trim().length >= 3).sort((a,b) => b[0].length-a[0].length).map(([s, target]) => {
        const names = [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
        const pieces = s.split(/\{\w+\}/g).map(escape);
        return { source: new RegExp('^' + pieces.join('(.+?)') + '$'), target, names };
      });
      patterns.set(language, templates);
    }
    for (const template of templates) {
      const match = source.match(template.source);
      if (!match) continue;
      result = template.target.replace(/\{(\w+)\}/g, (whole, name: string) => {
        const i = template.names.indexOf(name);
        return i < 0 ? whole : translateText(match[i + 1]);
      });
      break;
    }
  }
  if (result === undefined) {
    let matcher = fragments.get(language);
    if (!matcher) {
      const entries = Object.keys(dictionary).filter((s) => s.length > 1 && !/\{\w+\}/.test(s)).sort((a,b) => b.length-a.length);
      matcher = new RegExp(entries.length ? '(?<![\\p{L}\\p{N}_])(?:' + entries.map(escape).join('|') + ')(?![\\p{L}\\p{N}_])' : '(?!)', 'gu');
      fragments.set(language, matcher);
    }
    result = source.replace(matcher, (part) => dictionary[part] ?? part);
  }
  const translated = text.match(/^\s/) ? ' ' + result : result;
  const final = text.match(/\s$/) ? translated + ' ' : translated;
  if (cache.size > 5000) cache.clear();
  cache.set(key, final);
  return final;
}

/** Translate presentation values only: ids, mission rules, numbers and React elements stay intact. */
export function t<T>(value: T): T {
  if (typeof value === 'string') return translateText(value) as T;
  if (Array.isArray(value)) return value.map((item) => t(item)) as T;
  return value;
}
