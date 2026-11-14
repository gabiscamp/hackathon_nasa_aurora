import { useState } from 'react';
import { Button } from '../ui/Button';
import './TitleScreen.css';

interface TitleScreenProps {
  onStart: (name: string) => void;
}

export function TitleScreen({ onStart }: TitleScreenProps) {
  const [name, setName] = useState('');

  const handleStart = () => {
    if (name.trim().length >= 2) {
      onStart(name.trim());
    }
  };

  return (
    <div className="title-screen">
      <div className="title-stars" />
      <div className="title-content">
        <div className="title-badge">NASA SPACE APPS 2026</div>
        <h1 className="title-name">
          <span className="title-orbit">AURORA</span>
          <span className="title-sub">STATION</span>
        </h1>
        <p className="title-tagline">A Mars Orbit Mission</p>

        <div className="title-form">
          <label className="title-label" htmlFor="commander-name">
            What is your name, Commander?
          </label>
          <input
            id="commander-name"
            className="title-input"
            type="text"
            placeholder="Type your name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            maxLength={20}
            autoFocus
          />
          <Button
            variant="primary"
            size="lg"
            icon="🚀"
            onClick={handleStart}
            disabled={name.trim().length < 2}
          >
            Start Mission
          </Button>
        </div>

        <p className="title-footer">
          Based on real NASA data and missions
        </p>
      </div>
    </div>
  );
}
