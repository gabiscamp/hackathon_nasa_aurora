let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export function playKeyTick() {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * 0.012;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 3000 + Math.random() * 1500;

  const gain = ctx.createGain();
  gain.gain.value = 0.025 + Math.random() * 0.01;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

let alertAudio: HTMLAudioElement | null = null;
let alertPlaying = false;

export function playAlertSound() {
  if (alertPlaying) return;
  alertPlaying = true;
  try {
    if (!alertAudio) {
      alertAudio = new Audio('/sounds/alert.mp3');
      alertAudio.volume = 0.05;
      alertAudio.loop = false;
    }
    alertAudio.currentTime = 0;
    alertAudio.play().catch(() => {
      playAlertFallback();
    });
    setTimeout(() => {
      if (alertAudio) {
        alertAudio.pause();
        alertAudio.currentTime = 0;
      }
      alertPlaying = false;
    }, 2000);
  } catch {
    playAlertFallback();
    alertPlaying = false;
  }
}

function playAlertFallback() {
  const ctx = getCtx();
  const times = [0, 0.3, 0.6];
  for (const offset of times) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, ctx.currentTime + offset);
    gain.gain.setValueAtTime(0.1, ctx.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.22);
    osc.start(ctx.currentTime + offset);
    osc.stop(ctx.currentTime + offset + 0.25);
  }
}

export function playChoiceSound() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(523, ctx.currentTime);
  osc.frequency.setValueAtTime(659, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}
