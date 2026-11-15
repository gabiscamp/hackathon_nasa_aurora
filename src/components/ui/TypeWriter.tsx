import { useState, useEffect } from 'react';
import { playKeyTick } from '../../utils/sounds';

interface TypeWriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  sound?: boolean;
}

export function TypeWriter({ text, speed = 30, onComplete, className = '', sound = true }: TypeWriterProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        if (sound && i % 2 === 0) playKeyTick();
        i++;
      } else {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onComplete, sound]);

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
