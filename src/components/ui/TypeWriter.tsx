import { useState, useEffect, useRef, useCallback } from 'react';
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
 * While it is typing, a click anywhere on the page shows the whole text at once. That click
 * only finishes the text (it doesn't also press what is under the pointer), so a hurried
 * click can't pick a choice by accident. Navigation buttons (inside <nav> or [data-typing-pass])
 * are not held back: "Skip", "Main menu", "Read" and "Options" work with one click.
 */
export function TypeWriter({ text, speed = 30, onComplete, className = '', sound = true }: TypeWriterProps) {
  const textSpeed = useSettingsStore((s) => s.textSpeed);
  const readAloud = useSettingsStore((s) => s.readAloud);
  const instant = textSpeed === 'instant';
  const [displayed, setDisplayed] = useState(instant ? text : '');
  const [done, setDone] = useState(instant);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // onComplete runs once per text, whether typing ends by itself or is skipped.
  const completedRef = useRef(false);

  const finish = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDisplayed(text);
    setDone(true);
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [text, onComplete]);

  useEffect(() => {
    completedRef.current = false;
    if (instant) {
      setDisplayed(text);
      setDone(true);
      // Next tick: parent effects that reset their "ready" flags run after this child effect.
      const t = setTimeout(() => {
        completedRef.current = true;
        onComplete?.();
      }, 0);
      return () => clearTimeout(t);
    }
    setDisplayed('');
    setDone(false);
    let i = 0;
    // The typing ticks would talk over the voice, so they stay quiet while reading aloud.
    const ticks = sound && !readAloud;
    intervalRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        if (ticks && i % 2 === 0) playKeyTick();
        i++;
      } else {
        finish();
      }
    }, speed * textSpeedFactor(textSpeed));
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [text, speed, onComplete, sound, instant, textSpeed, readAloud, finish]);

  // Click anywhere while typing → whole text now. Window + capture phase runs before any
  // button's handler; stopPropagation keeps that click from also pressing the button
  // (other typewriters on the page still get it: they listen on window too).
  useEffect(() => {
    if (done) return;
    const onClick = (e: MouseEvent) => {
      // Navigation and accessibility buttons (Main menu, Skip, Read, Options, game Menu/Help)
      // work at once: only clicks elsewhere (like on a choice) are held back to finish the text.
      const target = e.target as Element | null;
      if (target?.closest('nav, [data-typing-pass]')) return;
      e.stopPropagation();
      e.preventDefault();
      finish();
    };
    window.addEventListener('click', onClick, true);
    return () => window.removeEventListener('click', onClick, true);
  }, [done, finish]);

  useEffect(() => {
    if (!readAloud) return;
    speak(text);
    return () => stopSpeaking();
  }, [text, readAloud]);

  return (
    <span className={`typewriter ${done ? 'typewriter-done' : ''} ${className}`}>
      {displayed}
      {!done && <span className="typewriter-cursor">▌</span>}
    </span>
  );
}
