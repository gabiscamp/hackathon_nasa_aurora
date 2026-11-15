import { useEffect, useState } from 'react';
import { ScreenNav } from '../ui/ScreenNav';
import { Button } from '../ui/Button';
import { TypeWriter } from '../ui/TypeWriter';
import { commanderLabel } from '../../data/crew';
import './MissionBriefing.css';

interface MissionBriefingProps {
  playerName: string;
  onContinue: () => void;
  onBack: () => void;
}

const MESSAGES = [
  '{commander}, this is Mission Control.',
  'You are in command of Aurora Station, orbiting Mars.',
  'Your mission lasts 45 days. During this time, you must:',
  'Keep your crew breathing, fed, and healthy.',
  'Manage the station\'s energy, water, and oxygen.',
  'Collect scientific data about Mars.',
  'And make tough decisions when things go wrong.',
  'Because they will go wrong.',
  'Good luck, Commander. The next message will take a while.',
  'Mission Control, signing off.',
];

export function MissionBriefing({ playerName, onContinue, onBack }: MissionBriefingProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [allDone, setAllDone] = useState(false);

  const currentMessage = MESSAGES[messageIndex].replace('{commander}', commanderLabel(playerName));
  const isLast = messageIndex === MESSAGES.length - 1;

  const handleNext = () => {
    if (isLast) {
      setAllDone(true);
    } else {
      setMessageIndex((i) => i + 1);
    }
  };

  // Enter = next message (when no button has focus, so it never fires twice).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      if (allDone) onContinue();
      else if (isLast) setAllDone(true);
      else setMessageIndex((i) => i + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [allDone, isLast, onContinue]);

  return (
    <div className="briefing-screen">
      <ScreenNav
        backLabel="Main menu"
        onBack={onBack}
        skipLabel={allDone ? undefined : 'Skip message'}
        onSkip={
          allDone
            ? undefined
            : () => {
                setMessageIndex(MESSAGES.length - 1);
                setAllDone(true);
              }
        }
      />
      <main className="briefing-container">
        <h1 className="sr-only">Message from Mission Control</h1>
        <div className="briefing-radio">
          {/* TODO: replace with real asset — UI radio/antenna icon */}
          <svg className="briefing-radio-icon" width="56" height="56" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 40h24M24 40V24" />
            <circle cx="24" cy="20" r="4" fill="currentColor" />
            <path d="M15 11a13 13 0 0 0 0 18M33 11a13 13 0 0 1 0 18M9 5a21 21 0 0 0 0 30M39 5a21 21 0 0 1 0 30" />
          </svg>
          <div className="briefing-radio-label">INCOMING TRANSMISSION</div>
          <div className="briefing-radio-static" />
        </div>

        <div className="briefing-message-box">
          {allDone ? (
            // Skipped or finished: no more typing, so "Meet Your Crew" works with one click.
            <span className="typewriter typewriter-done briefing-text">{currentMessage}</span>
          ) : (
            <TypeWriter key={messageIndex} text={currentMessage} speed={25} className="briefing-text" />
          )}
        </div>

        <div className="briefing-dots" role="img" aria-label={`Message ${messageIndex + 1} of ${MESSAGES.length}`}>
          {MESSAGES.map((_, i) => (
            <div
              key={i}
              className={`briefing-dot ${i === messageIndex ? 'active' : ''} ${i < messageIndex ? 'done' : ''}`}
            />
          ))}
        </div>

        {!allDone ? (
          <Button variant="primary" size="lg" className="briefing-next" onClick={handleNext}>
            {isLast ? 'End Transmission' : 'Continue'} <kbd className="gm-kbd">Enter</kbd>
          </Button>
        ) : (
          <Button variant="primary" size="lg" className="briefing-next" onClick={onContinue}>
            Meet Your Crew
          </Button>
        )}
      </main>
    </div>
  );
}
