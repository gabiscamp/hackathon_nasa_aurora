import { useState } from 'react';
import { CREW_DEFINITIONS } from '../../data/crew';
import { ProgressBar } from '../ui/ProgressBar';
import { Button } from '../ui/Button';
import './CrewIntro.css';

interface CrewIntroProps {
  playerName: string;
  onContinue: () => void;
}

const ROLE_ICONS: Record<string, string> = {
  engineer: '🔧',
  medic: '💚',
  scientist: '🔬',
};

export function CrewIntro({ playerName, onContinue }: CrewIntroProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [viewedAll, setViewedAll] = useState(false);
  const [viewed, setViewed] = useState<Set<number>>(new Set());

  const handleSelect = (i: number) => {
    setSelectedIndex(i);
    const next = new Set(viewed);
    next.add(i);
    setViewed(next);
    if (next.size === CREW_DEFINITIONS.length) {
      setViewedAll(true);
    }
  };

  const selected = selectedIndex !== null ? CREW_DEFINITIONS[selectedIndex] : null;

  return (
    <div className="crew-screen">
      <div className="crew-container">
        <h2 className="crew-title">Your Crew</h2>
        <p className="crew-subtitle">
          Tap each crew member to learn about them, Commander {playerName}.
        </p>

        <div className="crew-cards">
          {CREW_DEFINITIONS.map((member, i) => (
            <button
              key={member.id}
              className={`crew-card-btn ${selectedIndex === i ? 'selected' : ''} ${viewed.has(i) ? 'viewed' : ''}`}
              style={{ '--crew-color': member.color } as React.CSSProperties}
              onClick={() => handleSelect(i)}
            >
              <div className="crew-avatar" style={{ borderColor: member.color }}>
                {ROLE_ICONS[member.role] || '⭐'}
              </div>
              <span className="crew-card-name">{member.name.split(' ')[0]}</span>
              <span className="crew-card-role">{member.roleLabel}</span>
              {viewed.has(i) && <span className="crew-check">✓</span>}
            </button>
          ))}
        </div>

        {selected && (
          <div className="crew-detail animate-slideUp" key={selected.id}>
            <div className="crew-detail-header">
              <div className="crew-detail-avatar" style={{ borderColor: selected.color }}>
                {ROLE_ICONS[selected.role] || '⭐'}
              </div>
              <div>
                <h3 className="crew-detail-name">{selected.name}</h3>
                <span className="crew-detail-role" style={{ color: selected.color }}>
                  {selected.roleLabel}
                </span>
              </div>
            </div>

            <p className="crew-detail-desc">{selected.description}</p>
            <p className="crew-detail-phrase">{selected.phrase}</p>

            <div className="crew-skills">
              {selected.skills.map((skill) => (
                <ProgressBar
                  key={skill.label}
                  label={skill.label}
                  value={skill.value}
                  color={selected.color}
                  size="sm"
                />
              ))}
            </div>
          </div>
        )}

        {!selected && (
          <div className="crew-placeholder">
            <p>👆 Tap a crew member above</p>
          </div>
        )}

        {viewedAll && (
          <div className="crew-footer animate-fadeIn">
            <p className="crew-footer-text">
              That's your team. Each one is great at their job.
              But if someone is busy or sick, the others can help — just not as well.
              Choosing who does what is YOUR job.
            </p>
            <Button variant="primary" size="lg" icon="🎮" onClick={onContinue}>
              Learn How the Station Works
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
