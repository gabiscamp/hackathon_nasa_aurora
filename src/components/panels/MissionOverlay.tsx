import { t as localize } from '../../i18n/translate';
import { useState, useCallback } from 'react';
import { useMissionStore } from '../../stores/useMissionStore';
import { SHOWN_RESOURCES, useResourceStore, type ResourceKey } from '../../stores/useResourceStore';
import { useGameStore } from '../../stores/useGameStore';
import { useDutyStore, availability, CREW_SLOTS, type CrewDuty } from '../../stores/useDutyStore';
import {
  choiceState,
  crewNeed,
  deferMission,
  fillPatient,
  patientOf,
  pickOutsideCrew,
  sendCrew,
  sideRiskChance,
  successChance,
  type MissionResult,
} from '../../engine/missionEngine';
import { TypeWriter } from '../ui/TypeWriter';
import { playChoiceSound, playMissionResult } from '../../utils/sounds';
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
  const radiation = useResourceStore((s) => s.radiation);

  const resources: { key: ResourceKey; value: number }[] = [
    { key: 'food', value: food },
    { key: 'water', value: water },
    { key: 'energy', value: energy },
    { key: 'oxygen', value: oxygen },
    { key: 'radiation', value: radiation },
  ];

  return (
    <div className="resource-hints" aria-label={localize("Current resources")}>
      <span className="resource-hints__label">{localize("Current resources:")}</span>
      <div className="resource-hints__list">
        {localize(resources.map((r) => {
          const info = RESOURCE_LABELS[r.key];
          const isLow = r.key === 'radiation' ? r.value > 60 : r.value < 30;
          return (
            <span key={r.key} className={`resource-chip ${isLow ? 'resource-chip--warning' : ''}`}>
              <span aria-hidden="true">{localize(info.icon)}</span>
              <span className="sr-only">{localize(info.name)}: </span> {localize(Math.round(r.value))}
              {localize(isLow && <span className="sr-only">{localize(", warning")}</span>)}
            </span>
          );
        }))}
      </div>
    </div>
  );
}

/** "Changes" list after a choice: e.g. Oxygen −3, Energy +2 (radiation up is bad). */
function Changes({ changes }: { changes: Partial<Record<ResourceKey, number>> }) {
  const entries = (Object.entries(changes) as [ResourceKey, number][]).filter(([k]) => SHOWN_RESOURCES.includes(k));
  if (entries.length === 0) return null;
  return (
    <div className="mission-changes" aria-label={localize("What changed")}>
      {localize(entries.map(([key, d]) => {
        const good = key === 'radiation' ? d < 0 : d > 0;
        return (
          <span key={key} className={`effect-badge ${good ? 'effect-badge--positive' : 'effect-badge--negative'}`}>
            {localize(RESOURCE_LABELS[key].name)} {localize(d > 0 ? '+' : '−')}
            {localize(Math.abs(Math.round(d)))}
          </span>
        );
      }))}
    </div>
  );
}

/** Short facts about a choice before picking it: people, best role, time, chance, temporary. */
function ChoiceMeta({ choice, lockedReason, patientName, outside }: { choice: Choice; lockedReason: string | null; patientName: string; outside: boolean }) {
  const need = crewNeed(choice);
  const people = need.everyone
    ? 'Whole crew'
    : need.min === 0
      ? need.max
        ? `+${need.max} helper`
        : outside
          ? 'Only the person outside'
          : `Only ${patientName}`
      : need.only
        ? `Only the ${need.only.map(slotTitle).join(' or ')}`
        : `${need.min}${need.max && need.max > need.min ? `–${need.max}` : ''} ${need.min === 1 && !need.max ? 'person' : 'people'}`;
  const risk = sideRiskChance(choice.sideRisk);
  return (
    <span className="mission-choice__meta">
      <span className="choice-tag">{localize(people)}</span>
      {localize(need.allowFewer && <span className="choice-tag">{localize("Can try with fewer (harder)")}</span>)}
      {localize(need.best && <span className="choice-tag">{localize("Best: ")}{localize(need.best.map(slotTitle).join(' or '))}</span>)}
      {localize(choice.time && <span className="choice-tag">{localize(choice.time)}</span>)}
      {localize((choice.busyDays ?? 0) > 0 && <span className="choice-tag choice-tag--warn">{localize("Busy ")}{localize((choice.busyDays ?? 0) + 1)}{localize(" days")}</span>)}
      {localize(choice.successRate !== undefined && !choice.noVerdict && (
        <span className="choice-tag choice-tag--warn">{localize("Risky: ")}{localize(choice.successRate)}{localize("% chance")}</span>
      ))}
      {localize(risk !== null && <span className="choice-tag choice-tag--warn">{localize(risk)}{localize("% risk: ")}{localize(choice.sideRisk!.effects.map((e) => e.resource).join(', '))}</span>)}
      {localize(choice.temporary && <span className="choice-tag choice-tag--warn">{localize("Temporary fix")}</span>)}
      {localize(choice.needsCandles && <span className="choice-tag">{localize("Uses ")}{localize(choice.needsCandles)}{localize(" oxygen candle")}{localize(choice.needsCandles > 1 ? 's' : '')}</span>)}
      {localize(lockedReason && <span className="choice-tag choice-tag--bad">{localize(lockedReason)}</span>)}
    </span>
  );
}

/** Caring for a sick crew member (stays with the patient during "whole crew" choices). */
function isCaringFor(d: CrewDuty): boolean {
  return d.task?.missionId === 'crew-sick' || d.task?.missionId === 'crew-very-sick';
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

  const fill = (text: string) => fillPatient(text.split('{outside}').join(outsideName), mission.id);
  const description = fill(mission.description);
  const patient = patientOf(mission.id);
  const patientName = patient ? roster.find((r) => r.slot === patient)?.firstName ?? 'the patient' : 'the patient';

  const pickChoice = (c: Choice) => {
    playChoiceSound();
    setChoice(c);
    const need = crewNeed(c);
    // The whole crew goes, or only the person already outside / the patient: no picking needed.
    // "Whole crew" = everyone who can act: not the sick, and caretakers stay with their patient.
    if (need.everyone || (need.min === 0 && !need.max)) {
      const slots: CrewSlot[] = need.everyone
        ? CREW_SLOTS.filter((s) => !['sick', 'away'].includes(availability(duty[s], day)) && !isCaringFor(duty[s]))
        : outside
          ? [outside]
          : [];
      finish(c, slots);
    } else {
      setPhase('crew');
    }
  };

  const finish = (c: Choice, slots: CrewSlot[]) => {
    const all = outside && !slots.includes(outside) ? [outside, ...slots] : slots;
    const res = sendCrew(mission, c, all, day, playerName);
    playMissionResult(res.success);
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

      <div className="mission-overlay__panel" role="dialog" aria-modal="true" aria-label={localize(mission.title)}>
        <div className="mission-overlay__header">
          <span className="mission-overlay__icon">{localize(mission.icon)}</span>
          <h2 className="mission-overlay__title">{localize(mission.title)}</h2>
        </div>

        <div className="mission-overlay__source">{localize(" Based on: ")}{localize(mission.nasaSource)}
          {localize(mission.nasaYear ? ` (${mission.nasaYear})` : '')}
        </div>

        {localize(deferred && (
          <div className="mission-overlay__body" data-voice-story>
            <div className="mission-overlay__terminal">{localize(" You decided to deal with it tomorrow. ")}{localize(mission.defer ? fill(mission.defer.text) : '')}
            </div>
            <Changes changes={deferred} />
            <button className="mission-btn mission-btn--primary" onClick={onComplete} autoFocus>{localize(" Back to the station ")}</button>
          </div>
        ))}

        {localize(!deferred && phase === 'intro' && (
          <div className="mission-overlay__body">
            <div className="mission-overlay__terminal">
              <TypeWriter
                text={localize(description)}
                spokenText={localize(`${mission.title}. Based on ${mission.nasaSource}${mission.nasaYear ? `, ${mission.nasaYear}` : ''}. ${description}`)}
                speed={25}
                onComplete={handleIntroComplete}
              />
            </div>
            {localize(introReady && (
              <button className="mission-btn mission-btn--primary" onClick={() => setPhase('choices')} autoFocus>{localize(" What do we do, Commander? ")}</button>
            ))}
          </div>
        ))}

        {localize(!deferred && phase === 'choices' && (
          <div className="mission-overlay__body" data-voice-options>
            <ResourceHints />
            <p className="mission-overlay__prompt">{localize(" Think carefully: every choice has a cost. ")}{localize(freeCount)}{localize(" of your crew ")}{localize(freeCount === 1 ? 'is' : 'are')}{localize(" free right now. ")}</p>
            <div className="mission-overlay__choices">
              {localize(choices.map(({ c, state }, index) => (
                <button
                  key={c.id}
                  className="mission-choice"
                  disabled={!!state.lockedReason}
                  onClick={() => pickChoice(c)}
                  autoFocus={index === choices.findIndex(({ state: optionState }) => !optionState.lockedReason)}
                >
                  <span className="mission-choice__icon">{localize(c.icon)}</span>
                  <span className="mission-choice__content">
                    <span className="mission-choice__label">{localize(fill(c.label))}</span>
                    <ChoiceMeta choice={c} lockedReason={state.lockedReason} patientName={patientName} outside={!!outside} />
                  </span>
                </button>
              )))}
            </div>
            {localize(mission.defer && (
              <button className="mission-defer" onClick={handleDefer}>{localize(" Deal with it tomorrow ")}<span className="mission-defer__cost">{localize(fill(mission.defer.text))}</span>
              </button>
            ))}
            {localize(mission.defer === false && <p className="mission-overlay__hint">{localize("There is no time to wait: you must act now.")}</p>)}
          </div>
        ))}

        {localize(!deferred && phase === 'crew' && choice && (
          <CrewPicker
            mission={mission}
            choice={choice}
            day={day}
            lockedSlot={outside}
            chanceFor={(slots) => successChance(choice, outside ? [outside, ...slots] : slots, day)}
            onBack={() => setPhase('choices')}
            onSend={(slots) => finish(choice, slots)}
          />
        ))}

        {localize(!deferred && phase === 'result' && result && (
          <div className="mission-overlay__body" data-voice-story>
            {localize(choice && choice.successRate !== undefined && !result.noVerdict && (
              <p className={`mission-outcome ${result.success ? 'mission-outcome--good' : 'mission-outcome--bad'}`}>
                {localize(result.success ? 'It worked!' : 'It did not work.')}
              </p>
            ))}
            <div className="mission-overlay__terminal">
              <TypeWriter text={localize(result.narrative)} automaticNarration={false} speed={20} onComplete={handleResultComplete} />
            </div>
            <Changes changes={result.changes} />
            {localize(result.notes.length > 0 && (
              <ul className="mission-notes">
                {localize(result.notes.map((n) => (
                  <li key={n} className={n.startsWith('NEW PROBLEM') ? 'mission-notes__alert' : ''}>
                    {localize(n)}
                  </li>
                )))}
              </ul>
            ))}
            {localize(resultReady && (
              <button className="mission-btn mission-btn--primary" onClick={afterResult} autoFocus>
                {localize(result.retry ? 'Choose another way' : 'Did you know?')}
              </button>
            ))}
          </div>
        ))}

        {localize(!deferred && phase === 'popup' && (
          <div className="mission-overlay__body" data-voice-story>
            <div className="mission-overlay__nasa-badge">{localize(mission.factKind ? FACT_BADGE[mission.factKind] : '🚀 REAL NASA FACT')}</div>
            <div className="mission-overlay__terminal mission-overlay__terminal--nasa">
              <TypeWriter text={localize(mission.popup)} automaticNarration={false} speed={15} onComplete={handlePopupComplete} />
            </div>
            {localize(popupReady && (
              <button className="mission-btn mission-btn--primary" onClick={onComplete} autoFocus>{localize(" Continue Mission ")}</button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
