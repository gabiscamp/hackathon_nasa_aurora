import { useState, useEffect, useCallback } from 'react';
import { gameEvents, EVENTS } from '../../game/events';
import './DaySkipOverlay.css';

interface DaySkipOverlayProps {
  daysSkipped: number;
  targetDay: number;
  act: 1 | 2 | 3;
  commanderName: string;
  onContinue: () => void;
}

function skipNarrative(days: number): string {
  if (days === 0) return '';
  if (days === 1) return 'A quiet day. Normal consumption, everything running smoothly.';
  if (days <= 4) return `${days} days passed without incident. Recyclers working well, food steady.`;
  return `${days} calm days. The crew settled into routine. Resources consumed normally.`;
}

function missionIntro(act: 1 | 2 | 3): string {
  switch (act) {
    case 1: return "Alright crew, let's see what today brings!";
    case 2: return 'Commander, we have a situation.';
    case 3: return 'This is urgent. All hands!';
  }
}

type Phase = 'skip' | 'intro';

export function DaySkipOverlay({
  daysSkipped,
  targetDay,
  act,
  onContinue,
}: DaySkipOverlayProps) {
  const showSkip = daysSkipped > 0;
  const [phase, setPhase] = useState<Phase>(showSkip ? 'skip' : 'intro');
  const [bubbleDone, setBubbleDone] = useState(false);

  const text = phase === 'skip' ? skipNarrative(daysSkipped) : missionIntro(act);

  useEffect(() => {
    setBubbleDone(false);
    gameEvents.emit(EVENTS.SHOW_SPEECH_BUBBLE, text);

    const onDone = () => setBubbleDone(true);
    gameEvents.on('SPEECH_BUBBLE_DONE', onDone);
    return () => { gameEvents.off('SPEECH_BUBBLE_DONE', onDone); };
  }, [phase, text]);

  const handleContinue = useCallback(() => {
    gameEvents.emit(EVENTS.HIDE_SPEECH_BUBBLE);
    if (phase === 'skip') {
      setPhase('intro');
      setBubbleDone(false);
    } else {
      onContinue();
    }
  }, [phase, onContinue]);

  const dayLabel = phase === 'skip'
    ? `Day ${targetDay - daysSkipped} → Day ${targetDay}`
    : `Day ${targetDay}`;

  return (
    <div className="dayskip-overlay">
      <div className="dayskip-overlay__backdrop" />
      <div className="dayskip-hud">
        <span className="dayskip-hud__day">{dayLabel}</span>
        {bubbleDone && (
          <button className="mission-btn mission-btn--primary" onClick={handleContinue}>
            {phase === 'skip' ? 'Continue' : 'Begin Mission'}
          </button>
        )}
      </div>
    </div>
  );
}
