import { useState, useEffect } from 'react';

interface TypeWriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export function TypeWriter({ text, speed = 30, onComplete, className = '' }: TypeWriterProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

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
