/**
 * "Read aloud" with the browser's own voices (Web Speech API): no server, no audio files.
 * Kids aged 7–8 often read slowly; hearing the text while it appears helps them follow.
 */

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

function englishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang === 'en-US' && v.localService) ?? voices.find((v) => v.lang.startsWith('en'));
}

export function speak(text: string): void {
  if (!speechSupported || !text.trim()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.9;
  const voice = englishVoice();
  if (voice) u.voice = voice;
  synth.speak(u);
}

export function stopSpeaking(): void {
  if (speechSupported) window.speechSynthesis.cancel();
}
