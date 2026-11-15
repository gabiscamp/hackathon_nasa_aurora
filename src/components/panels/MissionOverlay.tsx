import { useState, useCallback, useEffect } from 'react';
import { useMissionStore } from '../../stores/useMissionStore';
import { useResourceStore, type ResourceKey } from '../../stores/useResourceStore';
import { resolveChoice } from '../../engine/eventResolver';
import { TypeWriter } from '../ui/TypeWriter';
import { playChoiceSound } from '../../utils/sounds';
import type { Choice } from '../../data/missions';
import './MissionOverlay.css';

interface MissionOverlayProps {
  onComplete: () => void;
}

const RESOURCE_LABELS: Record<ResourceKey, { icon: string; name: string }> = {
  food: { icon: '🍽', name: 'Food' },
  water: { icon: '💧', name: 'Water' },
  energy: { icon: '⚡', name: 'Energy' },
  oxygen: { icon: '🫁', name: 'Oxygen' },
  health: { icon: '❤️', name: 'Health' },
  satisfaction: { icon: '😊', name: 'Morale' },
  radiation: { icon: '☢️', name: 'Radiation' },
};

function ResourceHints() {
  const food = useResourceStore((s) => s.food);
  const water = useResourceStore((s) => s.water);
  const energy = useResourceStore((s) => s.energy);
  const oxygen = useResourceStore((s) => s.oxygen);
  const health = useResourceStore((s) => s.health);
  const satisfaction = useResourceStore((s) => s.satisfaction);
  const radiation = useResourceStore((s) => s.radiation);

  const resources: { key: ResourceKey; value: number }[] = [
    { key: 'food', value: food },
    { key: 'water', value: water },
    { key: 'energy', value: energy },
    { key: 'oxygen', value: oxygen },
    { key: 'health', value: health },
    { key: 'satisfaction', value: satisfaction },
    { key: 'radiation', value: radiation },
  ];

  return (
    <div className="resource-hints" data-read-skip>
      <span className="resource-hints__label">Current resources:</span>
      <div className="resource-hints__list">
        {resources.map((r) => {
          const info = RESOURCE_LABELS[r.key];
          const isLow = r.key === 'radiation' ? r.value > 60 : r.value < 30;
          return (
            <span key={r.key} className={`resource-chip ${isLow ? 'resource-chip--warning' : ''}`}>
              {info.icon} {Math.round(r.value)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

type Phase = 'intro' | 'choices' | 'result' | 'popup';

export function MissionOverlay({ onComplete }: MissionOverlayProps) {
  const mission = useMissionStore((s) => s.currentMission);
  const completeMission = useMissionStore((s) => s.completeMission);
  const applyDelta = useResourceStore((s) => s.applyDelta);

  const [phase, setPhase] = useState<Phase>('intro');
  const [introReady, setIntroReady] = useState(false);
  const [resultText, setResultText] = useState('');
  const [resultReady, setResultReady] = useState(false);
  const [popupReady, setPopupReady] = useState(false);

  useEffect(() => {
    if (mission) {
      setPhase('intro');
      setIntroReady(false);
      setResultText('');
      setResultReady(false);
      setPopupReady(false);
    }
  }, [mission]);

  const handleIntroComplete = useCallback(() => {
    setIntroReady(true);
  }, []);

  const showChoices = () => setPhase('choices');

  const handleChoice = (choice: Choice) => {
    playChoiceSound();
    const resolved = resolveChoice(choice);
    const delta: Partial<Record<ResourceKey, number>> = {};
    for (const eff of resolved.effects) {
      delta[eff.resource] = (delta[eff.resource] ?? 0) + eff.delta;
    }
    applyDelta(delta);
    setResultText(resolved.narrative);
    setPhase('result');
  };

  const handleResultComplete = useCallback(() => {
    setResultReady(true);
  }, []);

  const showPopup = () => setPhase('popup');

  const handlePopupComplete = useCallback(() => {
    setPopupReady(true);
  }, []);

  const handleFinish = () => {
    if (mission) {
      completeMission(mission.id);
    }
    onComplete();
  };

  if (!mission) return null;

  return (
    <div className="mission-overlay">
      <div className="mission-overlay__backdrop" />

      <div className="mission-overlay__panel" role="dialog" aria-modal="true" aria-label={mission.title}>
        <div className="mission-overlay__header">
          <span className="mission-overlay__icon">{mission.icon}</span>
          <h2 className="mission-overlay__title">{mission.title}</h2>
        </div>

        <div className="mission-overlay__source">
          Based on: {mission.nasaSource}{mission.nasaYear ? ` (${mission.nasaYear})` : ''}
        </div>

        {phase === 'intro' && (
          <div className="mission-overlay__body">
            <div className="mission-overlay__terminal">
              <TypeWriter
                text={mission.description}
                speed={25}
                onComplete={handleIntroComplete}
              />
            </div>
            {introReady && (
              <button className="mission-btn mission-btn--primary" onClick={showChoices}>
                What do we do, Commander?
              </button>
            )}
          </div>
        )}

        {phase === 'choices' && (
          <div className="mission-overlay__body">
            <ResourceHints />
            <p className="mission-overlay__prompt">Think carefully — every choice has a cost.</p>
            <div className="mission-overlay__choices">
              {mission.choices.map((choice) => (
                <button
                  key={choice.id}
                  className="mission-choice"
                  onClick={() => handleChoice(choice)}
                >
                  <span className="mission-choice__icon">{choice.icon}</span>
                  <span className="mission-choice__content">
                    <span className="mission-choice__label">{choice.label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className="mission-overlay__body">
            <div className="mission-overlay__terminal">
              <TypeWriter
                text={resultText}
                speed={20}
                onComplete={handleResultComplete}
              />
            </div>
            {resultReady && (
              <button className="mission-btn mission-btn--primary" onClick={showPopup}>
                Did you know?
              </button>
            )}
          </div>
        )}

        {phase === 'popup' && (
          <div className="mission-overlay__body">
            <div className="mission-overlay__nasa-badge">
              🚀 REAL NASA FACT
            </div>
            <div className="mission-overlay__terminal mission-overlay__terminal--nasa">
              <TypeWriter
                text={mission.popup}
                speed={15}
                onComplete={handlePopupComplete}
              />
            </div>
            {popupReady && (
              <button className="mission-btn mission-btn--primary" onClick={handleFinish}>
                Continue Mission
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
