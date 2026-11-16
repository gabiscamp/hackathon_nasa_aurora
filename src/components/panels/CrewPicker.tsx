import { t as localize } from '../../i18n/translate';
import { useEffect, useRef, useState } from 'react';
import type { Choice, CrewSlot, Mission } from '../../data/missions';
import { getMission } from '../../data/missions';
import { crewNeed, SPECIALIST_BONUS } from '../../engine/missionEngine';
import { useDutyStore, availability, fatigueLabel, CREW_SLOTS, FATIGUE_TIRED } from '../../stores/useDutyStore';
import { dutyText } from './CrewStatusList';
import { useCrewRoster } from './useCrewRoster';
import './CrewPicker.css';

const SLOT_TITLES: Record<CrewSlot, string> = {
  commander: 'Commander',
  engineer: 'Engineer',
  medic: 'Medic',
  scientist: 'Scientist',
};

export function slotTitle(slot: CrewSlot): string {
  return SLOT_TITLES[slot];
}

interface CrewPickerProps {
  mission: Mission;
  choice: Choice;
  day: number;
  /** Already involved (the person outside): shown, can't be removed. */
  lockedSlot: CrewSlot | null;
  /** Chance of success for this team, or null if the job can't fail. */
  chanceFor: (slots: CrewSlot[]) => number | null;
  onBack: () => void;
  onSend: (slots: CrewSlot[]) => void;
}

/**
 * "Who goes?" The player picks crew members for a job. Busy people can be pulled off their
 * job (it stops, progress is lost), resting people can't be sent, and some jobs can be tried
 * with fewer people than needed (harder).
 */
export function CrewPicker({ mission, choice, day, lockedSlot, chanceFor, onBack, onSend }: CrewPickerProps) {
  const roster = useCrewRoster();
  const duty = useDutyStore((s) => s.crew);
  const need = crewNeed(choice);
  const max = Math.max(need.max ?? need.min, need.min, 1);
  const [picked, setPicked] = useState<CrewSlot[]>([]);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    listRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true });
  }, []);

  const toggle = (slot: CrewSlot) =>
    setPicked((p) => (p.includes(slot) ? p.filter((s) => s !== slot) : p.length >= max ? [...p.slice(1), slot] : [...p, slot]));

  const enough = picked.length >= need.min;
  const canTryFewer = !enough && !!need.allowFewer && picked.length >= 1;
  const chance = chanceFor(picked);
  const pulled = picked.filter((s) => availability(duty[s], day) === 'busy');
  const freeOthers = CREW_SLOTS.filter(
    (s) => s !== lockedSlot && availability(duty[s], day) === 'free' && (!need.only || need.only.includes(s)),
  ).length;

  return (
    <div className="mission-overlay__body crew-picker" data-voice-options>
      <p className="mission-overlay__prompt">{localize(" Who goes? ")}<strong>{localize(choice.label)}</strong>{localize(" needs ")}{localize(need.min === 0 ? `up to ${max}` : need.min)}
        {localize(need.max && need.max > need.min ? `–${need.max}` : '')} {localize(max === 1 ? 'person' : 'people')}
        {localize(need.best ? `. Best: ${need.best.map(slotTitle).join(' or ')}${chanceFor([]) !== null ? ` (+${SPECIALIST_BONUS}% chance)` : ''}` : '')}.
      </p>
      {localize(freeOthers < need.min && (
        <p className="crew-picker__warn" role="status">{localize(" Not enough free crew! You can pull someone off a job, ")}{localize(need.allowFewer ? 'try with fewer people, ' : '')}{localize("or go back and deal with it tomorrow. ")}</p>
      ))}

      <ul ref={listRef} className="crew-picker__list" aria-label={localize(`Crew for ${mission.title}`)}>
        {localize(lockedSlot && (
          <li>
            <div className="crew-card crew-card--locked">
              {localize(cardBody(lockedSlot))}
              <span className="crew-card__note">{localize("Already outside: part of every choice")}</span>
            </div>
          </li>
        ))}
        {localize(CREW_SLOTS.filter((s) => s !== lockedSlot).map((slot) => {
          const d = duty[slot];
          const state = availability(d, day);
          const selected = picked.includes(slot);
          const isBest = need.best?.includes(slot);
          const task = d.task;
          const taskMission = task ? getMission(task.missionId) : undefined;
          const caring = task?.missionId === 'crew-sick' || task?.missionId === 'crew-very-sick';
          const stopText = caring
            ? 'The sick crew member will be left alone and get better more slowly.'
            : taskMission?.choices.find((c) => c.id === task?.choiceId)?.onInterrupt?.text;
          const notAllowed = !!need.only && !need.only.includes(slot);
          const noEva = !!choice.spacewalk && !!d.noSpacewalk;
          return (
            <li key={slot}>
              <button
                type="button"
                className={`crew-card crew-card--${state} ${selected ? 'crew-card--selected' : ''}`}
                aria-pressed={selected}
                disabled={state === 'resting' || state === 'sick' || state === 'away' || notAllowed || noEva}
                onClick={() => toggle(slot)}
              >
                {localize(cardBody(slot))}
                {localize(isBest && !notAllowed && <span className="crew-card__best">{localize("Best for this job")}</span>)}
                {localize(notAllowed && <span className="crew-card__note">{localize("Only the ")}{localize(need.only!.map(slotTitle).join(' or '))}{localize(" can do this")}</span>)}
                {localize(noEva && !notAllowed && <span className="crew-card__note">{localize("No more spacewalks (radiation dose)")}</span>)}
                {localize(state === 'busy' && selected && (
                  <span className="crew-card__note crew-card__note--warn">{localize(" This stops \"")}{localize(task?.label)}". {localize(stopText ?? 'Progress is lost.')}
                  </span>
                ))}
                {localize(d.fatigue >= FATIGUE_TIRED && state !== 'resting' && (
                  <span className="crew-card__note crew-card__note--warn">{localize("Tired: more likely to make mistakes.")}</span>
                ))}
              </button>
            </li>
          );
        }))}
      </ul>

      <p className="crew-picker__summary" aria-live="polite">
        {localize(picked.length === 0 && !lockedSlot
          ? 'Tap a crew member to send them.'
          : chance === null
            ? enough || lockedSlot
              ? 'This will work for sure.'
              : `Pick ${need.min - picked.length} more.`
            : `Chance of success: ${chance}%${!enough && need.allowFewer ? ' (fewer people: harder)' : ''}`)}
        {localize(pulled.length > 0 && ` · ${pulled.length} job${pulled.length > 1 ? 's' : ''} will stop`)}
      </p>

      <div className="crew-picker__actions">
        <button type="button" className="mission-btn" onClick={onBack}>{localize(" Back ")}</button>
        <button
          type="button"
          className="mission-btn mission-btn--primary"
          disabled={!(enough || canTryFewer || (lockedSlot && need.min === 0 && picked.length > 0))}
          onClick={() => onSend(picked)}
        >
          {localize(canTryFewer ? 'Try with fewer people' : `Send ${picked.length === 1 ? '1 person' : `${picked.length} people`}`)}
        </button>
      </div>
    </div>
  );

  function cardBody(slot: CrewSlot) {
    const r = roster.find((x) => x.slot === slot)!;
    const d = duty[slot];
    return (
      <>
        <span className="crew-card__face" style={{ borderColor: r.color }}>
          {localize(r.photo ? <img src={r.photo} alt={localize("")} /> : r.firstName.charAt(0))}
        </span>
        <span className="crew-card__name">{localize(r.firstName)}</span>
        <span className="crew-card__role">{localize(slotTitle(slot))}</span>
        <span className="crew-card__state">{localize(dutyText(d, day))}</span>
        <span className={`crew-card__tired crew-card__tired--${Math.min(d.fatigue, 4)}`}>{localize(fatigueLabel(d.fatigue))}</span>
      </>
    );
  }
}
