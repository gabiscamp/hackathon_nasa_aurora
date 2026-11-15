import { useDutyStore, availability, fatigueLabel } from '../../stores/useDutyStore';
import { ROOM_NAMES } from '../hud/LocationHint';
import type { RoomId } from '../../game/world/shipLayout';
import type { CrewDuty } from '../../stores/useDutyStore';
import { useCrewRoster } from './useCrewRoster';
import './CrewStatusList.css';

/** One line of text about what a crew member is doing on `day`. */
const SICK_TEXT: Record<string, string> = {
  pending: 'Sick: needs a decision',
  rest: 'Sick: resting with care',
  isolation: 'Sick: in isolation',
  severe: 'Very sick: needs constant care',
};

export function dutyText(duty: CrewDuty, day: number): string {
  const state = availability(duty, day);
  if (state === 'sick' && duty.illness) {
    const until = duty.illness.untilDay ? ` until Day ${duty.illness.untilDay}` : '';
    return `${SICK_TEXT[duty.illness.mode] ?? 'Sick'}${until}`;
  }
  if (state === 'resting') return `Resting until Day ${duty.restUntilDay}`;
  if (state === 'busy' && duty.task) {
    const room = ROOM_NAMES[duty.task.room as RoomId] ?? duty.task.room;
    const until = duty.task.untilDay > day ? ` until Day ${duty.task.untilDay}` : ' today';
    const sick = duty.illness?.mode === 'working' ? ' · sick, still working' : '';
    if (duty.task.missionId === 'crew-sick' || duty.task.missionId === 'crew-very-sick') return `Busy: ${duty.task.label}${sick}`;
    return `Busy: ${duty.task.label} (${room})${until}${sick}`;
  }
  if (duty.illness?.mode === 'working') return 'Sick, but still working';
  return 'Free';
}

/** Who is free, busy, resting or tired on `day`. Text + a colored dot, never color alone. */
export function CrewStatusList({ day, title }: { day: number; title?: string }) {
  const roster = useCrewRoster();
  const duty = useDutyStore((s) => s.crew);

  return (
    <section className="crew-status" aria-label={title ?? 'Crew'}>
      {title && <h3 className="crew-status__title">{title}</h3>}
      <ul className="crew-status__list">
        {roster.map((r) => {
          const d = duty[r.slot];
          const state = availability(d, day);
          return (
            <li key={r.slot} className={`crew-status__row crew-status__row--${state}`}>
              <span className="crew-status__face" style={{ borderColor: r.color }}>
                {r.photo ? <img src={r.photo} alt="" /> : r.firstName.charAt(0)}
              </span>
              <span className="crew-status__who">
                <strong>{r.firstName}</strong> <span className="crew-status__role">{r.roleLabel}</span>
              </span>
              <span className="crew-status__what">{dutyText(d, day)}</span>
              <span className={`crew-status__tired crew-status__tired--${Math.min(d.fatigue, 4)}`}>{fatigueLabel(d.fatigue)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
