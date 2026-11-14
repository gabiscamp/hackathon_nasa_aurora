import { useState } from 'react';
import { Button } from '../ui/Button';
import { TypeWriter } from '../ui/TypeWriter';
import './MissionBriefing.css';

interface MissionBriefingProps {
  playerName: string;
  onContinue: () => void;
}

const MESSAGES = [
  'Commander {name}, this is Mission Control.',
  'You are in command of Aurora Station, orbiting Mars.',
  'Your mission lasts 90 days. During this time, you must:',
  'Keep your crew breathing, fed, and healthy.',
  'Manage the station\'s energy, water, and oxygen.',
  'Collect scientific data about Mars.',
  'And make tough decisions when things go wrong.',
  'Because they will go wrong.',
  'Good luck, Commander. The next message will take a while.',
  'Mission Control, signing off.',
];

export function MissionBriefing({ playerName, onContinue }: MissionBriefingProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [allDone, setAllDone] = useState(false);

  const currentMessage = MESSAGES[messageIndex].replace('{name}', playerName);
  const isLast = messageIndex === MESSAGES.length - 1;

  const handleNext = () => {
    if (isLast) {
      setAllDone(true);
    } else {
      setMessageIndex((i) => i + 1);
    }
  };

  return (
    <div className="briefing-screen">
      <div className="briefing-container">
        <div className="briefing-radio">
          <div className="briefing-radio-icon">📡</div>
          <div className="briefing-radio-label">INCOMING TRANSMISSION</div>
          <div className="briefing-radio-static" />
        </div>

        <div className="briefing-message-box">
          <TypeWriter
            key={messageIndex}
            text={currentMessage}
            speed={25}
            className="briefing-text"
          />
        </div>

        <div className="briefing-dots">
          {MESSAGES.map((_, i) => (
            <div
              key={i}
              className={`briefing-dot ${i === messageIndex ? 'active' : ''} ${i < messageIndex ? 'done' : ''}`}
            />
          ))}
        </div>

        {!allDone ? (
          <Button variant="ghost" size="md" onClick={handleNext}>
            {isLast ? 'End Transmission' : 'Continue ▸'}
          </Button>
        ) : (
          <Button variant="primary" size="lg" icon="👥" onClick={onContinue}>
            Meet Your Crew
          </Button>
        )}
      </div>
    </div>
  );
}
