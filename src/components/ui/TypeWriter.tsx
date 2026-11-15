import { useState, useEffect } from 'react';
import { playKeyTick } from '../../utils/sounds';
import { speak, stopSpeaking } from '../../utils/speech';
import { textSpeedFactor, useSettingsStore } from '../../stores/useSettingsStore';

interface TypeWriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  sound?: boolean;
}

/**
 * Letter-by-letter text. Follows the player's Options: slower, all at once, and read aloud.
 * Clicking the text shows it all at once.
 */
export function TypeWriter({ text, speed = 30, onComplete, className = '', sound = true }: TypeWriterProps) {
  const textSpeed = useSettingsStore((s) => s.textSpeed);
  const readAloud = useSettingsStore((s) => s.readAloud);
  const instant = textSpeed === 'instant';
  const [displayed, setDisplayed] = useState(instant ? text : '');
  const [done, setDone] = useState(instant);

  useEffect(() => {
    if (instant) {
      setDisplayed(text);
      setDone(true);
      // Next tick: parent effects that reset their "ready" flags run after this child effect.
      const t = setTimeout(() => onComplete?.(), 0);
      return () => clearTimeout(t);
    }
    setDisplayed('');
    setDone(false);
    let i = 0;
    // The typing ticks would talk over the voice, so they stay quiet while reading aloud.
    const ticks = sound && !readAloud;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        if (ticks && i % 2 === 0) playKeyTick();
        i++;
      } else {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, speed * textSpeedFactor(textSpeed));
    return () => clearInterval(interval);
  }, [text, speed, onComplete, sound, instant, textSpeed, readAloud]);

  useEffect(() => {
    if (!readAloud) return;
    speak(text);
    return () => stopSpeaking();
  }, [text, readAloud]);

  return (
    <span
      className={`typewriter ${done ? 'typewriter-done' : ''} ${className}`}
      onClick={() => {
        if (!done) {
          setDisplayed(text);
          setDone(true);
          onComplete?.();
        }
      }}
    >
      {displayed}
      {!done && <span className="typewriter-cursor">▌</span>}
    </span>
  );
}
