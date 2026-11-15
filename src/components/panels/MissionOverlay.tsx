import { useState, useCallback } from 'react';
import { useMissionStore } from '../../stores/useMissionStore';
import { useResourceStore, type ResourceKey } from '../../stores/useResourceStore';
import { useGameStore } from '../../stores/useGameStore';
import { useDutyStore, availability } from '../../stores/useDutyStore';
import {
  choiceState,
  crewNeed,
  deferMission,
  pickOutsideCrew,
  sendCrew,
  successChance,
  type MissionResult,
} from '../../engine/missionEngine';
import { TypeWriter } from '../ui/TypeWriter';
import { playChoiceSound } from '../../utils/sounds';
import type { Choice, CrewSlot } from '../../data/missions';
import { CrewPicker, slotTitle } from './CrewPicker';
import { useCrewRoster } from './useCrewRoster';
import './MissionOverlay.css';

interface MissionOverlayProps {
  /** Called when the window closes (mission solved, or left for tomorrow). */
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

const FACT_BADGE = {
  history: 'REAL SPACE HISTORY',
  simulation: 'NASA SIMULATION',
  tip: 'SPACE TIP',
} as const;

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

/** "Changes" list after a choice: e.g. Oxygen −3, Energy +2 (radiation up is bad). */
function Changes({ changes }: { changes: Partial<Record<ResourceKey, number>> }) {
  const entries = Object.entries(changes) as [ResourceKey, number][];
  if (entries.length === 0) return null;
  return (
    <div className="mission-changes" aria-label="What changed">
      {entries.map(([key, d]) => {
        const good = key === 'radiation' ? d < 0 : d > 0;
        return (
          <span key={key} className={`effect-badge ${good ? 'effect-badge--positive' : 'effect-badge--negative'}`}>
            {RESOURCE_LABELS[key].name} {d > 0 ? '+' : '−'}
            {Math.abs(Math.round(d))}
          </span>
        );
      })}
    </div>
  );
}

/** Short facts about a choice before picking it: people, best role, time, chance, temporary. */
function ChoiceMeta({ choice, lockedReason }: { choice: Choice; lockedReason: string | null }) {
  const need = crewNeed(choice);
  const people = need.everyone
    ? 'Whole crew'
    : need.min === 0
      ? need.max
        ? `+${need.max} helper`
        : 'Only the person outside'
      : `${need.min}${need.max && need.max > need.min ? `–${need.max}` : ''} ${need.min === 1 && !need.max ? 'person' : 'people'}`;
  return (
    <span className="mission-choice__meta">
      <span className="choice-tag">{people}</span>
      {need.allowFewer && <span className="choice-tag">Can try with fewer (harder)</span>}
      {need.best && <span className="choice-tag">Best: {need.best.map(slotTitle).join(' or ')}</span>}
      {choice.time && <span className="choice-tag">{choice.time}</span>}
      {(choice.busyDays ?? 0) > 0 && <span className="choice-tag choice-tag--warn">Busy {(choice.busyDays ?? 0) + 1} days</span>}
      {choice.successRate !== undefined && <span className="choice-tag choice-tag--warn">Risky: {choice.successRate}% chance</span>}
      {choice.temporary && <span className="choice-tag choice-tag--warn">Temporary fix</span>}
      {choice.needsCandles && <span className="choice-tag">Uses {choice.needsCandles} oxygen candle{choice.needsCandles > 1 ? 's' : ''}</span>}
      {lockedReason && <span className="choice-tag choice-tag--bad">{lockedReason}</span>}
    </span>
  );
}

type Phase = 'intro' | 'choices' | 'crew' | 'result' | 'popup';

export function MissionOverlay({ onComplete }: MissionOverlayProps) {
  const mission = useMissionStore((s) => s.currentMission);
  const candles = useMissionStore((s) => s.candles);
  const lockedChoices = useMissionStore((s) => s.lockedChoices);
  const day = useGameStore((s) => s.day);
  const playerName = useGameStore((s) => s.playerName);
  const duty = useDutyStore((s) => s.crew);
  const roster = useCrewRoster();

  const [phase, setPhase] = useState<Phase>('intro');
  const [introReady, setIntroReady] = useState(false);
  const [resultReady, setResultReady] = useState(false);
  const [popupReady, setPopupReady] = useState(false);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<MissionResult | null>(null);
  const [deferred, setDeferred] = useState<Partial<Record<ResourceKey, number>> | null>(null);

  // "Someone is outside" missions: that person is part of every choice.
  const [outside] = useState<CrewSlot | null>(() => (mission?.crewOutside ? pickOutsideCrew(day) : null));
  const outsideName = outside ? roster.find((r) => r.slot === outside)?.firstName ?? 'Your astronaut' : '';

  const handleIntroComplete = useCallback(() => setIntroReady(true), []);
  const handleResultComplete = useCallback(() => setResultReady(true), []);
  const handlePopupComplete = useCallback(() => setPopupReady(true), []);

  if (!mission) return null;

  // Re-read on every render: candles and failed tries (lockedChoices) are subscribed above.
  void candles;
  void lockedChoices;
  const choices = mission.choices.map((c) => ({ c, state: choiceState(mission, c) })).filter((x) => !x.state.hidden);

  const description = mission.description.split('{outside}').join(outsideName);

  const pickChoice = (c: Choice) => {
    playChoiceSound();
    setChoice(c);
    const need = crewNeed(c);
    // The whole crew goes, or only the person already outside: no picking needed.
    if (need.everyone || (outside && need.min === 0 && !need.max)) {
      const slots: CrewSlot[] = need.everyone ? ['commander', 'engineer', 'medic', 'scientist'] : [outside!];
      finish(c, slots);
    } else {
      setPhase('crew');
    }
  };

  const finish = (c: Choice, slots: CrewSlot[]) => {
    const all = outside && !slots.includes(outside) ? [outside, ...slots] : slots;
    const res = sendCrew(mission, c, all, day, playerName);
    setResult(res);
    setResultReady(false);
    setPhase('result');
  };

  const handleDefer = () => {
    playChoiceSound();
    setDeferred(deferMission(mission, day));
  };

  const afterResult = () => {
    if (result?.retry) {
      // "Pick another option fast!": back to the choices, without the one that failed.
      setResult(null);
      setChoice(null);
      setPhase('choices');
      return;
    }
    setPhase('popup');
  };

  const freeCount = (['commander', 'engineer', 'medic', 'scientist'] as CrewSlot[]).filter(
    (s) => s !== outside && availability(duty[s], day) === 'free',
  ).length;

  return (
    <div className="mission-overlay">
      <div className="mission-overlay__backdrop" />

      <div className="mission-overlay__panel" role="dialog" aria-modal="true" aria-label={mission.title}>
        <div className="mission-overlay__header">
          <span className="mission-overlay__icon">{mission.icon}</span>
          <h2 className="mission-overlay__title">{mission.title}</h2>
        </div>

        <div className="mission-overlay__source">
          Based on: {mission.nasaSource}
          {mission.nasaYear ? ` (${mission.nasaYear})` : ''}
        </div>

        {deferred && (
          <div className="mission-overlay__body">
            <div className="mission-overlay__terminal">
              You decided to deal with it tomorrow. {mission.defer ? mission.defer.text : ''}
            </div>
            <Changes changes={deferred} />
            <button className="mission-btn mission-btn--primary" onClick={onComplete} autoFocus>
              Back to the station
            </button>
          </div>
        )}

        {!deferred && phase === 'intro' && (
          <div className="mission-overlay__body">
            <div className="mission-overlay__terminal">
              <TypeWriter text={description} speed={25} onComplete={handleIntroComplete} />
            </div>
            {introReady && (
              <button className="mission-btn mission-btn--primary" onClick={() => setPhase('choices')} autoFocus>
                What do we do, Commander?
              </button>
            )}
          </div>
        )}

        {!deferred && phase === 'choices' && (
          <div className="mission-overlay__body">
            <ResourceHints />
            <p className="mission-overlay__prompt">
              Think carefully: every choice has a cost. {freeCount} of your crew {freeCount === 1 ? 'is' : 'are'} free right now.
            </p>
            <div className="mission-overlay__choices">
              {choices.map(({ c, state }) => (
                <button
                  key={c.id}
                  className="mission-choice"
                  disabled={!!state.lockedReason}
                  onClick={() => pickChoice(c)}
                >
                  <span className="mission-choice__icon">{c.icon}</span>
                  <span className="mission-choice__content">
                    <span className="mission-choice__label">{c.label}</span>
                    <ChoiceMeta choice={c} lockedReason={state.lockedReason} />
                  </span>
                </button>
              ))}
            </div>
            {mission.defer && (
              <button className="mission-defer" onClick={handleDefer}>
                Deal with it tomorrow
                <span className="mission-defer__cost">{mission.defer.text}</span>
              </button>
            )}
            {mission.defer === false && <p className="mission-overlay__hint">There is no time to wait: you must act now.</p>}
          </div>
        )}

        {!deferred && phase === 'crew' && choice && (
          <CrewPicker
            mission={mission}
            choice={choice}
            day={day}
            lockedSlot={outside}
            chanceFor={(slots) => successChance(choice, outside ? [outside, ...slots] : slots, day)}
            onBack={() => setPhase('choices')}
            onSend={(slots) => finish(choice, slots)}
          />
        )}

        {!deferred && phase === 'result' && result && (
          <div className="mission-overlay__body">
            {choice && choice.successRate !== undefined && (
              <p className={`mission-outcome ${result.success ? 'mission-outcome--good' : 'mission-outcome--bad'}`}>
                {result.success ? 'It worked!' : 'It did not work.'}
              </p>
            )}
            <div className="mission-overlay__terminal">
              <TypeWriter text={result.narrative} speed={20} onComplete={handleResultComplete} />
            </div>
            <Changes changes={result.changes} />
            {result.notes.length > 0 && (
              <ul className="mission-notes">
                {result.notes.map((n) => (
                  <li key={n} className={n.startsWith('NEW PROBLEM') ? 'mission-notes__alert' : ''}>
                    {n}
                  </li>
                ))}
              </ul>
            )}
            {resultReady && (
              <button className="mission-btn mission-btn--primary" onClick={afterResult} autoFocus>
                {result.retry ? 'Choose another way' : 'Did you know?'}
              </button>
            )}
          </div>
        )}

        {!deferred && phase === 'popup' && (
          <div className="mission-overlay__body">
            <div className="mission-overlay__nasa-badge">{mission.factKind ? FACT_BADGE[mission.factKind] : '🚀 REAL NASA FACT'}</div>
            <div className="mission-overlay__terminal mission-overlay__terminal--nasa">
              <TypeWriter text={mission.popup} speed={15} onComplete={handlePopupComplete} />
            </div>
            {popupReady && (
              <button className="mission-btn mission-btn--primary" onClick={onComplete} autoFocus>
                Continue Mission
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
