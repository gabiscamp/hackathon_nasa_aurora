import { create } from 'zustand';

/**
 * "Read aloud" with the browser's own voices (Web Speech API): no server, no audio files.
 * Kids aged 7–8 often read slowly; hearing the text while it appears helps them follow.
 */

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** true while a voice is talking (drives the Read / Stop button). */
export const useSpeaking = create<{ speaking: boolean }>(() => ({ speaking: false }));

function englishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang === 'en-US' && v.localService) ?? voices.find((v) => v.lang.startsWith('en'));
}

// Each call gets an id so an old utterance ending does not flip the state of a newer one.
let runId = 0;

/** Reads the text, sentence by sentence (long single utterances get cut off in some browsers). */
export function speak(text: string): void {
  if (!speechSupported || !text.trim()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const id = ++runId;
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const voice = englishVoice();
  sentences.forEach((sentence, i) => {
    const u = new SpeechSynthesisUtterance(sentence);
    u.lang = 'en-US';
    u.rate = 0.9;
    if (voice) u.voice = voice;
    if (i === sentences.length - 1) {
      u.onend = () => id === runId && useSpeaking.setState({ speaking: false });
    }
    u.onerror = () => id === runId && useSpeaking.setState({ speaking: false });
    synth.speak(u);
  });
  useSpeaking.setState({ speaking: true });
}

export function stopSpeaking(): void {
  if (!speechSupported) return;
  runId++;
  window.speechSynthesis.cancel();
  useSpeaking.setState({ speaking: false });
}

const BLOCKS = new Set([
  'ADDRESS', 'ARTICLE', 'ASIDE', 'BUTTON', 'DD', 'DIV', 'DL', 'DT', 'FIELDSET',
  'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'LABEL',
  'LEGEND', 'LI', 'MAIN', 'NAV', 'OL', 'P', 'SECTION', 'TABLE', 'TD', 'TH', 'TR', 'UL',
]);

/** Whether this branch is actually available to sighted and assistive users. */
function hidden(el: Element): boolean {
  if (el.matches('[hidden], [aria-hidden="true"], [inert], script, style, template, svg:not([role="img"]):not([aria-label]), button kbd, .typewriter-cursor, [data-read-skip]')) {
    return true;
  }
  const style = window.getComputedStyle(el);
  return style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse';
}

function controlText(el: Element): string | null {
  const label = el.getAttribute('aria-label')?.trim();
  const role = el.getAttribute('role');

  if (role === 'meter' || role === 'progressbar') {
    const value = el.getAttribute('aria-valuetext') ?? el.getAttribute('aria-valuenow');
    const max = el.getAttribute('aria-valuemax');
    return [label, value && max ? `${value} out of ${max}` : value].filter(Boolean).join(', ');
  }
  if (el instanceof HTMLInputElement) {
    const name = label ?? el.labels?.[0]?.textContent?.trim() ?? '';
    if (el.type === 'radio' || el.type === 'checkbox') return `${name}, ${el.checked ? 'selected' : 'not selected'}`;
    return `${name} ${el.value}`.trim();
  }
  if (el instanceof HTMLLabelElement && el.control instanceof HTMLInputElement) {
    const input = el.control;
    const name = input.getAttribute('aria-label')?.trim() ?? el.textContent?.trim() ?? '';
    if (input.type === 'radio' || input.type === 'checkbox') return `${name}, ${input.checked ? 'selected' : 'not selected'}`;
  }
  if (label && (el.matches('button, img') || role === 'img')) return label;
  return null;
}

/** Accessible text of a visible element, with natural pauses between UI blocks. */
function rawText(el: Element): string {
  if (hidden(el)) return '';
  const canonical = el.getAttribute('data-read-text');
  if (canonical !== null) return canonical;

  const control = controlText(el);
  if (control !== null) return `${control}. `;

  const prefix = el.getAttribute('aria-label')?.trim();
  let result = prefix && el.matches('section, nav, fieldset, [role="group"]') ? `${prefix}. ` : '';
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) result += `${node.textContent ?? ''} `;
    else if (node instanceof Element) result += rawText(node);
  }
  const states: string[] = [];
  const checked = el.getAttribute('aria-checked');
  const selected = el.getAttribute('aria-selected');
  const pressed = el.getAttribute('aria-pressed');
  if (checked !== null) states.push(checked === 'true' ? 'selected' : 'not selected');
  if (selected !== null) states.push(selected === 'true' ? 'selected' : 'not selected');
  if (pressed !== null) states.push(pressed === 'true' ? 'pressed' : 'not pressed');
  if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') states.push('unavailable');
  if (states.length) result += `, ${states.join(', ')}. `;
  if (BLOCKS.has(el.tagName) || el.matches('[role="status"], [role="alert"], [role="option"], [role="tab"]')) result += '. ';
  return result;
}

export function elementText(el: Element): string {
  return rawText(el)
    .replace(/\p{Extended_Pictographic}️?/gu, '')
    .replace(/(\d+)\s*\/\s*(\d+)/g, '$1 of $2')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?:])/g, '$1')
    .replace(/\s*\.\s*(\.\s*)+/g, '. ')
    .replace(/([!?:])\./g, '$1')
    .trim();
}

/**
 * What "Read this screen" says: the open window if there is one (mission, menu, help…),
 * otherwise the complete visible main area. Canvas-only speech has a hidden DOM copy.
 */
export function screenText(): string {
  const dialogs = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')];
  const top = dialogs.filter((dialog) => !hidden(dialog)).at(-1);
  if (top) return elementText(top);
  const main = document.querySelector('main');
  if (main) return elementText(main);
  const marked = [...document.querySelectorAll('[data-read]')].filter((el) => !hidden(el));
  return marked.map(elementText).join(' ');
}

/** Read / stop toggle used by the Read buttons and the L key. */
export function toggleReadScreen(): void {
  if (useSpeaking.getState().speaking) stopSpeaking();
  else speak(screenText());
}
