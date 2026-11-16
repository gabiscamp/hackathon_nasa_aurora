import { useSettingsStore } from '../stores/useSettingsStore';
import { useSpeaking } from './speech';

type AudioChannel = 'music' | 'effects' | 'ui';
export type MusicMood = 'ambient' | 'cinematic';

interface AudioGraph {
  ctx: AudioContext;
  master: GainNode;
  channels: Record<AudioChannel, GainNode>;
  musicGain: GainNode;
  musicFilter: BiquadFilterNode;
  musicSources: OscillatorNode[];
  musicLfo: OscillatorNode;
}

let graph: AudioGraph | null = null;
let musicWanted = false;
let musicMood: MusicMood = 'ambient';
let alertActive = false;
let alertBufferPromise: Promise<AudioBuffer> | null = null;
let alertSource: AudioBufferSourceNode | null = null;
let alertGain: GainNode | null = null;
let fallbackAlertTimer: number | null = null;
let alertCycleTimer: number | null = null;
let lastStepTime = 0;
let lastRobotStepTime = 0;
let narrationActive = useSpeaking.getState().speaking;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function setGain(gain: GainNode, value: number, seconds = 0.08) {
  const now = gain.context.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setTargetAtTime(Math.max(0, value), now, seconds);
}

function syncVolumes() {
  const settings = useSettingsStore.getState();
  const accessibilityOn = settings.readAloud;
  const musicDuck = accessibilityOn ? (narrationActive ? 0.22 : 0.55) : 1;
  const effectsDuck = accessibilityOn ? (narrationActive ? 0.3 : 0.65) : 1;
  const uiDuck = accessibilityOn ? (narrationActive ? 0.2 : 0.45) : 1;
  if (graph) {
    setGain(graph.master, clamp01(settings.volume));
    setGain(graph.channels.music, clamp01(settings.musicVolume * musicDuck), narrationActive ? 0.16 : 0.35);
    setGain(graph.channels.effects, clamp01(settings.effectsVolume * effectsDuck), narrationActive ? 0.1 : 0.25);
    setGain(graph.channels.ui, clamp01(settings.uiVolume * uiDuck), 0.12);
  }
}

function syncMusic() {
  if (!graph) return;
  const settings = useSettingsStore.getState();
  // The alert gets the listener's attention without competing with the ambient harmony.
  // If world sounds are muted, there is no audible alert and therefore nothing to duck for.
  const alertAudible = alertActive && settings.effectsVolume > 0;
  const audible = musicWanted && !alertAudible;
  const moodLevel = musicMood === 'cinematic' ? 0.1 : 0.085;
  setGain(graph.musicGain, audible ? moodLevel : 0.0001, audible ? 0.8 : 0.16);
}

function createGraph(): AudioGraph {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  const channels = {
    music: ctx.createGain(),
    effects: ctx.createGain(),
    ui: ctx.createGain(),
  };
  Object.values(channels).forEach((channel) => channel.connect(master));
  master.connect(ctx.destination);

  const musicGain = ctx.createGain();
  musicGain.gain.value = 0.0001;
  const musicFilter = ctx.createBiquadFilter();
  musicFilter.type = 'lowpass';
  musicFilter.frequency.value = 680;
  musicFilter.Q.value = 0.5;
  musicGain.connect(musicFilter).connect(channels.music);

  // Original D-minor-nine pad. The cutscene and station ambience share the same tonal centre,
  // so the handoff feels intentional without turning normal gameplay into adventure music.
  const frequencies = [73.42, 110, 130.81, 164.81, 220];
  const musicSources = frequencies.map((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const voiceGain = ctx.createGain();
    oscillator.type = index < 2 ? 'sine' : 'triangle';
    oscillator.frequency.value = frequency;
    oscillator.detune.value = index % 2 === 0 ? -3 : 3;
    voiceGain.gain.value = index < 2 ? 0.2 : 0.08;
    oscillator.connect(voiceGain).connect(musicGain);
    oscillator.start();
    return oscillator;
  });

  const musicLfo = ctx.createOscillator();
  const lfoDepth = ctx.createGain();
  musicLfo.type = 'sine';
  musicLfo.frequency.value = 0.055;
  lfoDepth.gain.value = 180;
  musicLfo.connect(lfoDepth).connect(musicFilter.frequency);
  musicLfo.start();

  graph = { ctx, master, channels, musicGain, musicFilter, musicSources, musicLfo };
  syncVolumes();
  syncMusic();
  return graph;
}

function getGraph(): AudioGraph {
  const current = graph ?? createGraph();
  if (current.ctx.state === 'suspended') void current.ctx.resume();
  return current;
}

function output(channel: AudioChannel): GainNode {
  return getGraph().channels[channel];
}

function tone(
  channel: AudioChannel,
  frequency: number,
  duration: number,
  loudness: number,
  offset = 0,
  type: OscillatorType = 'sine',
  endFrequency?: number,
) {
  const { ctx } = getGraph();
  const start = ctx.currentTime + offset;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(loudness, start + Math.min(0.025, duration / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(output(channel));
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function noise(channel: AudioChannel, duration: number, loudness: number, cutoff: number) {
  const { ctx } = getGraph();
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / Math.max(1, length * 0.22));
  }
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  gain.gain.value = loudness;
  source.connect(filter).connect(gain).connect(output(channel));
  source.start();
}

/** Starts the unobtrusive station pad; browser autoplay unlocks it on the first interaction. */
export function startBackgroundMusic() {
  musicWanted = true;
  getGraph();
  syncMusic();
}

export function stopBackgroundMusic() {
  musicWanted = false;
  syncMusic();
}

/** Crossfades between the intro's fuller minor chord and the calmer in-game suspended chord. */
export function setMusicMood(mood: MusicMood) {
  musicMood = mood;
  const current = getGraph();
  const now = current.ctx.currentTime;
  const frequencies = mood === 'cinematic'
    ? [73.42, 110, 146.83, 174.61, 220]
    : [73.42, 110, 130.81, 164.81, 220];
  current.musicSources.forEach((source, index) => {
    source.frequency.cancelScheduledValues(now);
    source.frequency.setTargetAtTime(frequencies[index], now, 1.2);
  });
  current.musicFilter.frequency.setTargetAtTime(mood === 'cinematic' ? 920 : 680, now, 1.4);
  syncMusic();
}

export function playKeyTick() {
  if (useSettingsStore.getState().uiVolume === 0) return;
  noise('ui', 0.012, 0.012, 3200 + Math.random() * 700);
}

function playAlertPulse() {
  if (useSettingsStore.getState().effectsVolume === 0) return;
  // Red-alert klaxon: three urgent rising bursts with a low emergency layer.
  [0, 0.64, 1.28].forEach((offset) => {
    tone('effects', 360, 0.46, 0.082, offset, 'sawtooth', 560);
    tone('effects', 180, 0.46, 0.07, offset, 'triangle', 280);
  });
}

export function startAlertLoop() {
  if (alertActive) return;
  alertActive = true;
  getGraph();
  syncVolumes();
  syncMusic();
  void playAlertAudioCycle();
}

function loadAlertBuffer(): Promise<AudioBuffer> {
  if (!alertBufferPromise) {
    const { ctx } = getGraph();
    alertBufferPromise = fetch('/sounds/alert.mp3')
      .then((response) => {
        if (!response.ok) throw new Error(`Alert audio: ${response.status}`);
        return response.arrayBuffer();
      })
      .then((data) => ctx.decodeAudioData(data));
  }
  return alertBufferPromise;
}

/** Finds the quietest short window after the siren establishes itself, avoiding a mid-wave cut. */
function naturalAlertCut(buffer: AudioBuffer): number {
  const data = buffer.getChannelData(0);
  const from = Math.min(2.8, buffer.duration * 0.45);
  const to = Math.min(7, buffer.duration - 0.7);
  const windowSamples = Math.floor(buffer.sampleRate * 0.05);
  const stepSamples = Math.max(1, Math.floor(buffer.sampleRate * 0.025));
  let bestTime = Math.min(4.5, buffer.duration);
  let bestEnergy = Number.POSITIVE_INFINITY;
  for (let start = Math.floor(from * buffer.sampleRate); start < to * buffer.sampleRate; start += stepSamples) {
    let energy = 0;
    for (let i = 0; i < windowSamples && start + i < data.length; i += 4) {
      const sample = data[start + i];
      energy += sample * sample;
    }
    if (energy < bestEnergy) {
      bestEnergy = energy;
      bestTime = start / buffer.sampleRate;
    }
  }
  return Math.max(2.4, bestTime);
}

/** Plays one naturally bounded siren phrase, rests, then repeats while the emergency remains. */
async function playAlertAudioCycle() {
  if (!alertActive) return;
  try {
    const buffer = await loadAlertBuffer();
    if (!alertActive) return;
    const { ctx, channels } = getGraph();
    const duration = naturalAlertCut(buffer);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    source.buffer = buffer;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.48);
    gain.gain.setValueAtTime(0.22, now + Math.max(0.55, duration - 0.72));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(gain).connect(channels.effects);
    alertSource = source;
    alertGain = gain;
    source.onended = () => {
      if (alertSource === source) {
        alertSource = null;
        alertGain = null;
      }
      if (alertActive) alertCycleTimer = window.setTimeout(() => void playAlertAudioCycle(), 2600);
    };
    source.start(now);
    source.stop(now + duration);
  } catch {
    if (!alertActive || fallbackAlertTimer !== null) return;
    playAlertPulse();
    fallbackAlertTimer = window.setInterval(playAlertPulse, 5000);
  }
}

export function stopAlertLoop() {
  if (!alertActive) return;
  alertActive = false;
  if (fallbackAlertTimer !== null) window.clearInterval(fallbackAlertTimer);
  fallbackAlertTimer = null;
  if (alertCycleTimer !== null) window.clearTimeout(alertCycleTimer);
  alertCycleTimer = null;
  if (alertSource && alertGain && graph) {
    const now = graph.ctx.currentTime;
    alertGain.gain.cancelScheduledValues(now);
    alertGain.gain.setTargetAtTime(0.0001, now, 0.11);
    alertSource.stop(now + 0.5);
  }
  alertSource = null;
  alertGain = null;
  syncMusic();
}

export function playFootstep() {
  if (useSettingsStore.getState().effectsVolume === 0) return;
  const now = performance.now();
  if (now - lastStepTime < 310) return;
  lastStepTime = now;
  noise('effects', 0.055, 0.067, 620 + Math.random() * 100);
  tone('effects', 112 + Math.random() * 12, 0.065, 0.042, 0, 'sine', 72);
}

/** Soft rubber-wheel roll, including mids that remain audible on phone/laptop speakers. */
export function playRobotStep(proximity: number) {
  if (useSettingsStore.getState().effectsVolume === 0 || proximity <= 0) return;
  const now = performance.now();
  if (now - lastRobotStepTime < 420) return;
  lastRobotStepTime = now;
  const presence = 0.25 + clamp01(proximity) * 0.75;
  // Kept clearly audible at close range, but below the astronaut's footsteps and old servo sound.
  noise('effects', 0.2, 0.0546 * presence, 820);
  tone('effects', 185 + Math.random() * 12, 0.15, 0.0504 * presence, 0, 'sine', 125);
}

export function playChoiceSound(channel: Exclude<AudioChannel, 'music'> = 'ui') {
  const settings = useSettingsStore.getState();
  if ((channel === 'ui' ? settings.uiVolume : settings.effectsVolume) === 0) return;
  tone(channel, 523.25, 0.13, 0.048);
  tone(channel, 659.25, 0.14, 0.036, 0.07);
}

export function playRobotGreeting() {
  tone('effects', 620, 0.08, 0.048, 0, 'square', 540);
  tone('effects', 760, 0.09, 0.042, 0.1, 'square', 690);
  tone('effects', 930, 0.13, 0.036, 0.22, 'sine');
}

export function playDayStart() {
  tone('effects', 261.63, 0.28, 0.042);
  tone('effects', 392, 0.3, 0.04, 0.16);
  tone('effects', 523.25, 0.42, 0.036, 0.34);
}

export function playDayComplete() {
  tone('effects', 659.25, 0.28, 0.038);
  tone('effects', 523.25, 0.34, 0.034, 0.17);
}

export function playExplorationLaunch() {
  noise('effects', 0.42, 0.04, 850);
  tone('effects', 95, 0.55, 0.055, 0, 'sine', 210);
  tone('effects', 440, 0.25, 0.036, 0.25, 'sine');
}

export function playExplorationReturn(success: boolean) {
  tone('effects', 330, 0.18, 0.04);
  tone('effects', 440, 0.2, 0.038, 0.12);
  tone('effects', success ? 659.25 : 293.66, 0.34, 0.042, 0.26);
}

export function playMedalSound() {
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    tone('effects', frequency, 0.38, 0.04 - index * 0.004, index * 0.11, 'sine');
  });
}

export function playMissionOpen() {
  tone('effects', 392, 0.18, 0.045);
  tone('effects', 523.25, 0.24, 0.04, 0.11);
}

export function playMissionResult(success: boolean) {
  if (success) {
    tone('effects', 523.25, 0.2, 0.042);
    tone('effects', 659.25, 0.2, 0.04, 0.11);
    tone('effects', 783.99, 0.3, 0.035, 0.22);
  } else {
    tone('effects', 311.13, 0.24, 0.042);
    tone('effects', 233.08, 0.32, 0.035, 0.14);
  }
}

useSettingsStore.subscribe(() => {
  syncVolumes();
  syncMusic();
});

useSpeaking.subscribe((state) => {
  narrationActive = state.speaking;
  syncVolumes();
});
