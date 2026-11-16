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
        backLabel="Back"
        onBack={onBack}
        skipLabel={allSeen ? undefined : 'Skip to the game'}
        onSkip={allSeen ? undefined : onContinue}
      />

      <main className="crew-container" data-voice-story data-voice-options>
        <header className="crew-header">
          <h1 className="crew-title">Meet your crew</h1>
          <p className="crew-subtitle">Tap each astronaut to learn about them, {commanderLabel(playerName)}.</p>
          <p className="crew-progress" aria-live="polite">
            Seen {seen.size} of {members.length}
          </p>
        </header>

        <div className="crew-roster" role="tablist" aria-label="Crew members">
          {members.map((m, i) => {
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
                  {m.photo ? <img src={m.photo} alt="" /> : <span className="crew-photo__letter">{m.name.charAt(0)}</span>}
                  <span className="crew-photo__badge" aria-hidden="true">
                    <RoleIcon role={m.role} size={14} />
                  </span>
                </span>
                <span className="crew-tab__name">{m.role === 'commander' ? 'You' : firstName(m)}</span>
                <span className="crew-tab__role">{m.roleLabel}</span>
                <span className={`crew-tab__seen${seen.has(i) ? ' is-seen' : ''}`}>
                  {seen.has(i) ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Seen
                    </>
                  ) : (
                    'New'
                  )}
                </span>
              </button>
            );
          })}
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
              {current.photo ? <img src={current.photo} alt={`Portrait of ${current.name}`} /> : <span className="crew-photo__letter">{current.name.charAt(0)}</span>}
            </span>
            <span className="crew-profile__role-chip">
              <RoleIcon role={current.role} size={18} />
              {current.roleLabel}
            </span>
          </div>

          <div className="crew-profile__body">
            <div>
              {current.role === 'commander' && <p className="crew-profile__you">This is you</p>}
              <h2 className="crew-profile__name">{current.name}</h2>
              {current.specialty && <p className="crew-profile__specialty">{current.specialty}</p>}
            </div>

            <p className="crew-profile__desc">{current.description}</p>

            {current.strengths && (
              <p className="crew-profile__strengths">
                <strong>Strengths:</strong> {current.strengths}
              </p>
            )}

            {current.phrase && <blockquote className="crew-profile__quote">{current.phrase}</blockquote>}

            <div className="crew-skills">
              <h3 className="crew-skills__title">Skills</h3>
              <ul className="crew-skills__list">
                {current.skills.map((skill) => (
                  <li key={skill.label} className="crew-skill">
                    <span className="crew-skill__label">{skill.label}</span>
                    <span
                      className="crew-skill__track"
                      role="meter"
                      aria-label={skill.label}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={skill.value}
                    >
                      <span className="crew-skill__fill" style={{ width: `${skill.value}%` }} />
                    </span>
                    <span className="crew-skill__value">{skill.value}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <p className="crew-keys">Keyboard: ← → or 1–4 to switch.</p>

        {allSeen && (
          <footer className="crew-footer">
            <p className="crew-footer__text">
              That's your team. Each one is great at their job, and the others can help if someone is busy or sick. Choosing who does what is
              YOUR job.
            </p>
            <button type="button" className="crew-footer__btn" onClick={onContinue}>
              Learn how the station works
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </footer>
        )}
      </main>
    </div>
  );
}
