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

/** Things a voice should skip: key caps, icons, hidden helpers. */
const SKIP = 'button kbd, svg, [aria-hidden="true"], .typewriter-cursor, [data-read-skip]';
const BLOCKS = 'p, h1, h2, h3, h4, li, button, label, legend, section, header, footer, [role="meter"], .crew-tab__name';

/** Visible text of an element, with a pause between blocks. */
function textOf(el: Element): string {
  // Cinematic words are visually animated and aria-hidden; read their complete caption.
  if (el.hasAttribute('data-read') && el.getAttribute('aria-label')) return el.getAttribute('aria-label') ?? '';
  const clone = el.cloneNode(true) as Element;
  clone.querySelectorAll(SKIP).forEach((n) => n.remove());
  clone.querySelectorAll('*').forEach((n) => n.append(' '));
  clone.querySelectorAll(BLOCKS).forEach((n) => n.append('. '));
  return (clone.textContent ?? '')
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
 * otherwise the parts marked data-read (the game HUD), otherwise the whole page.
 */
export function screenText(): string {
  const dialogs = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')];
  const top = dialogs[dialogs.length - 1];
  if (top) return textOf(top);
  const marked = [...document.querySelectorAll('[data-read]')];
  if (marked.length) return marked.map(textOf).join(' ');
  const main = document.querySelector('main');
  return main ? textOf(main) : '';
}

/** Read / stop toggle used by the Read buttons and the L key. */
export function toggleReadScreen(): void {
  if (useSpeaking.getState().speaking) stopSpeaking();
  else speak(screenText());
}
