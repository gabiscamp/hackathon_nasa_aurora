import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ScreenNav } from '../ui/ScreenNav';
import { commanderLabel } from '../../data/crew';
import { getTeam } from '../../data/crews';
import { useGameStore } from '../../stores/useGameStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { IntroCrew } from './IntroCrew';
import { IntroStation } from './IntroStation';
import { LaunchBase, LaunchRocket } from './LaunchBranding';
import labUrl from '../../assets/station/lab.png';
import greenhouseUrl from '../../assets/station/greenhouse.png';
import nodeUrl from '../../assets/station/node.png';
import './MissionBriefing.css';
import { speak, stopSpeaking, speechSupported, useSpeaking } from '../../utils/speech';

// Seconds in the supplied MP3. Keep its opening intact; fade out before 49 s.
const SCENES = [
  { at: 0, kind: 'suspense', title: 'Before the journey', text: 'Are you ready…?' },
  { at: 8.8, kind: 'suspense', title: 'Far beyond home', text: 'To leave everything you know behind?' },
  { at: 12.6, kind: 'base', title: 'Earth · Aurora launch facility', text: 'Four explorers. One mission.' },
  { at: 16.6, kind: 'launch', title: '3… 2… 1… Liftoff!', text: 'Your journey to the Red Planet begins.' },
  { at: 24.6, kind: 'cockpit', title: 'Leaving Earth · Crew aboard', text: 'Earth grows smaller. Your team is all you have.' },
  { at: 28.6, kind: 'travel', title: 'Across the silence', text: 'Six to nine months of travel… far from home.' },
  { at: 32.6, kind: 'orbit', title: 'Much later · Mars orbit', text: '{commander}, welcome to Aurora Station. Your assignment: 45 days.' },
  { at: 36.6, kind: 'mission', title: 'The mission', text: 'Protect your crew. Manage food, water, energy and oxygen. Explore Mars. Every decision matters.' },
  { at: 44.6, kind: 'command', title: 'Mission Control · Signing off', text: 'You are in command now… Meet your crew.' },
] as const;
const END_TIME = 49;
const FADE_START = 47;
const DESCRIPTIONS = [
  'A question appears against a dark screen.',
  'The screen remains dark.',
  'Four astronauts prepare at the Aurora launch facility.',
  'Flames ignite beneath a rocket as it lifts away from Earth.',
  'Inside the capsule, four astronauts face the windows. Earth recedes behind them.',
  'The scene fades to darkness for the long journey.',
  'Aurora Station appears above Mars.',
  'The greenhouse, life support equipment, and laboratory illustrate your responsibilities.',
  'The transmission ends. The screen darkens before the crew introduction.',
];

export function MissionBriefing({ playerName, onContinue, onBack }: { playerName: string; onContinue: () => void; onBack: () => void }) {
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [error, setError] = useState('');
  const [musicLevel, setMusicLevel] = useState(100);
  const readAloud = useSettingsStore((s) => s.readAloud);
  const speaking = useSpeaking((s) => s.speaking);
  const narrated = speechSupported && readAloud;
  const waitingForVoice = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const finished = useRef(false);
  const onContinueRef = useRef(onContinue);
  useEffect(() => { onContinueRef.current = onContinue; }, [onContinue]);
  const volume = useSettingsStore((s) => s.volume);
  const crewId = useGameStore((s) => s.crewId);
  const team = getTeam(crewId);
  let index = 0;
  SCENES.forEach((cue, i) => { if (time >= cue.at) index = i; });
  const scene = SCENES[index];
  const untilNext = SCENES[index + 1]?.at ?? END_TIME;
  const beforeCut = untilNext - time;
  const cutOpacity = index < SCENES.length - 1 && beforeCut < .25 ? Math.max(0, beforeCut / .25) : 1;
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    audioRef.current?.pause();
    stopSpeaking();
    onContinueRef.current();
  };
  const play = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setError('');
    void audio.play().then(() => { setStarted(true); setPlaying(true); }).catch(() => {
      setError('Unable to play the soundtrack. Try again or skip the introduction.');
      setPlaying(false);
    });
  };
  useEffect(() => {
    const audio = audioRef.current;
    const effectiveLevel = narrated ? Math.min(musicLevel, 10) : musicLevel;
    if (audio) audio.volume = muted ? 0 : Math.min(1, volume * effectiveLevel / 100 * Math.max(0, 1 - Math.max(0, time - FADE_START) / (END_TIME - FADE_START)));
  }, [volume, muted, time, musicLevel, narrated]);
  useEffect(() => {
    if (!started || !playing || !narrated) return;
    speak(`${DESCRIPTIONS[index]} ${SCENES[index].text.replace('{commander}', commanderLabel(playerName))}`);
    return () => stopSpeaking();
  }, [index, started, playing, narrated, playerName]);
  useEffect(() => {
    if (!speaking && waitingForVoice.current && playing) {
      waitingForVoice.current = false;
      void audioRef.current?.play().catch(() => setPlaying(false));
    }
  }, [speaking, playing]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let frame = 0;
    const update = () => {
      const now = audio.currentTime;
      const boundary = SCENES[index + 1]?.at ?? FADE_START;
      if (narrated && useSpeaking.getState().speaking && now >= boundary - .05) {
        audio.pause();
        audio.currentTime = Math.max(SCENES[index].at, boundary - .05);
        waitingForVoice.current = true;
        frame = requestAnimationFrame(update);
        return;
      }
      setTime(now);
      if (now >= END_TIME && !finished.current) {
        finished.current = true; audio.pause(); onContinueRef.current(); return;
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    const hide = () => { if (document.hidden) { audio.pause(); setPlaying(false); } };
    document.addEventListener('visibilitychange', hide);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', hide); };
  }, [index, narrated]);
  useEffect(() => {
    const audio = audioRef.current;
    return () => { audio?.pause(); stopSpeaking(); };
  }, []);
  const words = scene.text.replace('{commander}', commanderLabel(playerName)).split(' ');

  return <div className={`intro-film${time >= FADE_START ? ' intro-film--ending' : ''}${!playing ? ' intro-film--paused' : ''}`}>
    <audio ref={audioRef} src="/assets/cutscene/trailer-music.mp3" preload="auto" onEnded={finish} onError={() => { setError('Soundtrack unavailable. Retry or skip the introduction.'); setPlaying(false); }} />
    <ScreenNav backLabel="Main menu" onBack={onBack} skipLabel="Skip introduction" onSkip={finish} />
    {!started ? <div className="intro-start">
      <p>AURORA STATION</p><h1>Are you ready to leave Earth?</h1>
      <p>A cinematic journey · 49 seconds</p>
      <p className="intro-accessibility-note">Prefer listening? Start with English narration, scene descriptions and music at 10%. Scenes wait for the voice.</p>
      {speechSupported && <button type="button" onClick={() => {
        setMusicLevel(10);
        useSettingsStore.getState().set({ readAloud: true });
        play();
      }}>Start with narration · Music 10%</button>}
      {!speechSupported && <p>Your browser does not support built-in narration. Full captions are available to screen readers.</p>}
      <button type="button" onClick={play}>Start introduction</button>
      {error && <p role="alert">{error}</p>}
    </div> : <>
      <main key={index} className={`intro-scene intro-scene--${scene.kind}`} style={{ filter: `brightness(${cutOpacity})` }}>
        <div className="intro-visual" aria-hidden="true">
          {(scene.kind === 'base' || scene.kind === 'launch') && <>
            <LaunchBase />
            <div className="intro-rocket"><LaunchRocket />{scene.kind === 'launch' && <span className="intro-flame" />}</div>
            {scene.kind === 'base' && <IntroCrew heads={team.heads} />}
            {scene.kind === 'launch' && <div className="intro-smoke" />}
          </>}
          {scene.kind === 'cockpit' && <div className="intro-cockpit-tableau"><img src="/assets/cutscene/cockpit.png" alt="" /><IntroCrew heads={team.heads} seated /></div>}
          {scene.kind === 'orbit' && <><img className="intro-background" src="/assets/environments/mars-backdrop.jpg" alt="" /><IntroStation /></>}
          {scene.kind === 'mission' && <div className="intro-responsibilities">
            <div><img src={greenhouseUrl} alt="" /><span>Keep your crew healthy</span></div>
            <div><img src={nodeUrl} alt="" /><span>Protect life support</span></div>
            <div><img src={labUrl} alt="" /><span>Explore & discover</span></div>
          </div>}
        </div>
        <section className="intro-caption">
          <p className="intro-chapter">{scene.title}</p>
          <p className="intro-text intro-timed-text" aria-label={words.join(' ')} data-read>
            {words.map((word, i) => <span key={i} aria-hidden="true" style={{ '--word-delay': `${i * .09}s` } as CSSProperties}>{word} </span>)}
          </p>
        </section>
        {scene.kind !== 'suspense' && scene.kind !== 'travel' && scene.kind !== 'command' && <small className="intro-ai-credit">AI-generated scenery · Fictional mission</small>}
      </main>
      <div className="intro-playback">
        <button type="button" onClick={() => { if (playing) { audioRef.current?.pause(); setPlaying(false); } else play(); }}>{playing ? 'Pause' : 'Resume'}</button>
        <button type="button" aria-pressed={!muted} onClick={() => setMuted((m) => !m)}>{muted ? 'Sound: off' : 'Sound: on'}</button>
        <label className="intro-music-volume">Music {narrated ? Math.min(musicLevel, 10) : musicLevel}%
          <input type="range" min="0" max="100" step="5" value={narrated ? Math.min(musicLevel, 10) : musicLevel} aria-label="Music volume. At 10 percent or below, English narration turns on." onChange={(event) => {
            const nextLevel = Number(event.target.value);
            setMusicLevel(nextLevel);
            if (speechSupported) useSettingsStore.getState().set({ readAloud: nextLevel <= 10 });
          }} />
        </label>
        {speechSupported && <button type="button" aria-pressed={readAloud} onClick={() => {
          if (readAloud) stopSpeaking();
          else setMusicLevel(10);
          useSettingsStore.getState().set({ readAloud: !readAloud });
        }}>{readAloud ? 'Narration: on' : 'Narration: off'}</button>}
      </div>
      {error && <p className="intro-error" role="alert">{error}</p>}
    </>}
    <div className="intro-blackout" aria-hidden="true" />
  </div>;
}
