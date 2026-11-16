import { t as localize } from '../../i18n/translate';
import { useEffect, useState } from 'react';
import { commanderLabel } from '../../data/crew';
import { getTeam } from '../../data/crews';
import type { SeatProfile } from '../../data/astronauts';
import { useCrewStore } from '../../stores/useCrewStore';
import { RoleIcon } from '../ui/RoleIcon';
import { ScreenNav } from '../ui/ScreenNav';
import './CrewIntro.css';

interface CrewIntroProps {
  playerName: string;
  onContinue: () => void;
  onBack: () => void;
}

function firstName(seat: SeatProfile): string {
  return seat.name.split(' ')[0];
}

/**
 * "Meet your crew" (team briefing, screen 3): the player taps each astronaut to see
 * their profile. Commander (the player) first. Keys: ← → or 1–4 switch profiles.
 */
export function CrewIntro({ playerName, onContinue, onBack }: CrewIntroProps) {
  const teamId = useCrewStore((s) => s.teamId);
  const team = getTeam(teamId);
  const members = [team.commander, ...team.seats];

  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  const allSeen = seen.size === members.length;
  const current = members[index];

  const show = (i: number) => {
    setIndex(i);
    setSeen((prev) => new Set(prev).add(i));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = ['1', '2', '3', '4'].indexOf(e.key);
      if (n >= 0) show(n);
      else if (e.key === 'ArrowRight') show((index + 1) % members.length);
      else if (e.key === 'ArrowLeft') show((index - 1 + members.length) % members.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="crew-screen">
      <ScreenNav
        backLabel={localize("Back")}
        onBack={onBack}
        skipLabel={localize(allSeen ? undefined : 'Skip to the game')}
        onSkip={allSeen ? undefined : onContinue}
      />

      <main className="crew-container" data-voice-story data-voice-options>
        <header className="crew-header">
          <h1 className="crew-title">{localize("Meet your crew")}</h1>
          <p className="crew-subtitle">{localize("Tap each astronaut to learn about them, ")}{localize(commanderLabel(playerName))}.</p>
          <p className="crew-progress" aria-live="polite">{localize(" Seen ")}{localize(seen.size)}{localize(" of ")}{localize(members.length)}
          </p>
        </header>

        <div className="crew-roster" role="tablist" aria-label={localize("Crew members")}>
          {localize(members.map((m, i) => {
            const active = i === index;
            return (
              <button
                key={m.role}
                type="button"
                role="tab"
                id={`crew-tab-${i}`}
                aria-selected={active}
                aria-controls="crew-panel"
                className={`crew-tab${active ? ' crew-tab--active' : ''}`}
                style={{ ['--role-color' as string]: m.color }}
                onClick={() => show(i)}
              >
                <span className="crew-photo crew-photo--tab">
                  {localize(m.photo ? <img src={m.photo} alt={localize("")} /> : <span className="crew-photo__letter">{localize(m.name.charAt(0))}</span>)}
                  <span className="crew-photo__badge" aria-hidden="true">
                    <RoleIcon role={m.role} size={14} />
                  </span>
                </span>
                <span className="crew-tab__name">{localize(m.role === 'commander' ? 'You' : firstName(m))}</span>
                <span className="crew-tab__role">{localize(m.roleLabel)}</span>
                <span className={`crew-tab__seen${seen.has(i) ? ' is-seen' : ''}`}>
                  {localize(seen.has(i) ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>{localize(" Seen ")}</>
                  ) : (
                    'New'
                  ))}
                </span>
              </button>
            );
          }))}
        </div>

        <section
          id="crew-panel"
          role="tabpanel"
          aria-labelledby={`crew-tab-${index}`}
          className="crew-profile"
          data-voice-story
          key={current.role}
          style={{ ['--role-color' as string]: current.color }}
        >
          <div className="crew-profile__media">
            <span className="crew-photo crew-photo--hero">
              {localize(current.photo ? <img src={current.photo} alt={localize(`Portrait of ${current.name}`)} /> : <span className="crew-photo__letter">{localize(current.name.charAt(0))}</span>)}
            </span>
            <span className="crew-profile__role-chip">
              <RoleIcon role={current.role} size={18} />
              {localize(current.roleLabel)}
            </span>
          </div>

          <div className="crew-profile__body">
            <div>
              {localize(current.role === 'commander' && <p className="crew-profile__you">{localize("This is you")}</p>)}
              <h2 className="crew-profile__name">{localize(current.name)}</h2>
              {localize(current.specialty && <p className="crew-profile__specialty">{localize(current.specialty)}</p>)}
            </div>

            <p className="crew-profile__desc">{localize(current.description)}</p>

            {localize(current.strengths && (
              <p className="crew-profile__strengths">
                <strong>{localize("Strengths:")}</strong> {localize(current.strengths)}
              </p>
            ))}

            {localize(current.phrase && <blockquote className="crew-profile__quote">{localize(current.phrase)}</blockquote>)}

            <div className="crew-skills">
              <h3 className="crew-skills__title">{localize("Skills")}</h3>
              <ul className="crew-skills__list">
                {localize(current.skills.map((skill) => (
                  <li key={skill.label} className="crew-skill">
                    <span className="crew-skill__label">{localize(skill.label)}</span>
                    <span
                      className="crew-skill__track"
                      role="meter"
                      aria-label={localize(skill.label)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={skill.value}
                    >
                      <span className="crew-skill__fill" style={{ width: `${skill.value}%` }} />
                    </span>
                    <span className="crew-skill__value">{localize(skill.value)}%</span>
                  </li>
                )))}
              </ul>
            </div>
          </div>
        </section>

        <p className="crew-keys">{localize("Keyboard: ← → or 1–4 to switch.")}</p>

        {localize(allSeen && (
          <footer className="crew-footer">
            <p className="crew-footer__text">{localize(" That's your team. Each one is great at their job, and the others can help if someone is busy or sick. Choosing who does what is YOUR job. ")}</p>
            <button type="button" className="crew-footer__btn" onClick={onContinue}>{localize(" Learn how the station works ")}<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </footer>
        ))}
      </main>
    </div>
  );
}
