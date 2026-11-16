import { t as localize } from '../../i18n/translate';
import { useEffect, useState } from 'react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { OptionsDialog } from '../ui/OptionsPanel';
import { RoleIcon } from '../ui/RoleIcon';
import { TEAMS, type CrewTeam } from '../../data/crews';
import type { SeatProfile } from '../../data/astronauts';
import './TitleScreen.css';

interface TitleScreenProps {
  onStart: (team: CrewTeam) => void;
  onOpenCredits: () => void;
  /** Mission left with "Main menu"; null when there is none. */
  savedMission: { commanderName: string; day: number } | null;
  onContinueMission: () => void;
  /** true while the credits overlay owns the keyboard. */
  creditsOpen: boolean;
}

/** Round portrait with the role icon as a small badge (icon + photo, never color alone). */
function Portrait({ seat, size }: { seat: SeatProfile; size: 'lg' | 'sm' }) {
  return (
    <span className={`portrait portrait--${size}`} style={{ ['--role-color' as string]: seat.color }}>
      {localize(seat.photo ? (
        <img src={seat.photo} alt={localize("")} loading="lazy" decoding="async" />
      ) : (
        <span className="portrait__fallback">{localize(seat.name.charAt(0))}</span>
      ))}
      <span className="portrait__badge" aria-hidden="true">
        <RoleIcon role={seat.role} size={size === 'lg' ? 16 : 13} />
      </span>
    </span>
  );
}

/**
 * Home: pick one of the two crews from the team briefing, led by Anne McClain or
 * Neil Armstrong (see crews.ts). Shortcuts: 1/2 choose, Enter start.
 */
export function TitleScreen({ onStart, onOpenCredits, savedMission, onContinueMission, creditsOpen }: TitleScreenProps) {
  const teams = TEAMS;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const selected = selectedIndex === null ? null : teams[selectedIndex];

  // Starting over would replace a saved mission, so ask first (error prevention).
  const start = () => {
    if (!selected) return;
    if (savedMission) setConfirmNew(true);
    else onStart(selected);
  };

  useEffect(() => {
    if (creditsOpen || confirmNew || optionsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const index = ['1', '2'].indexOf(e.key);
      if (index >= 0) setSelectedIndex(index);
      else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
        // Stop the same Enter from also clicking the dialog button that gets focus.
        e.preventDefault();
        start();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="title-screen">
      <div className="title-stars" aria-hidden="true" />

      {/* Settings and credits as game-style corner buttons (not web links), always in view. */}
      <nav className="title-topbar" aria-label={localize("Game options")}>
        <button type="button" className="title-top-btn" onClick={() => setOptionsOpen(true)} aria-haspopup="dialog" aria-label={localize("Settings")}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3.2" />
            <path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" />
          </svg>
          <span className="title-top-btn__label">{localize("Settings")}</span>
        </button>
        <button type="button" className="title-top-btn" onClick={onOpenCredits}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
            <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
          </svg>
          <span className="title-top-btn__label">{localize("Credits")}</span>
        </button>
      </nav>

      <main className="title-content" data-voice-story data-voice-options>
        <header className="title-header">
          <p className="title-badge">{localize("NASA Space Apps Challenge 2026")}</p>
          <h1 className="title-name">
            <span className="title-orbit">{localize("AURORA")}</span>
            <span className="title-sub">{localize("STATION")}</span>
          </h1>
          <p className="title-tagline">{localize("45 days in orbit around Mars. Keep your crew safe.")}</p>
        </header>

        {localize(savedMission && (
          <div className="title-continue">
            <button type="button" className="title-continue__btn" onClick={onContinueMission}>
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                <path d="M7 4.5v15l12-7.5z" />
              </svg>{localize(" Continue mission ")}</button>
            <span className="title-continue__info">{localize(" Commander ")}{localize(savedMission.commanderName)}{localize(" · Day ")}{localize(savedMission.day)}
            </span>
          </div>
        ))}

        <section className="title-pick" aria-labelledby="choose-crew">
          <div className="title-pick__intro">
            <h2 className="title-choose" id="choose-crew">
              {localize(savedMission ? 'Or start a new mission' : 'Choose your commander')}
            </h2>
            <p className="title-hint">{localize("You play as the commander. Each crew is made of real astronauts.")}</p>
          </div>

          <div className="title-crews" role="radiogroup" aria-labelledby="choose-crew">
            {localize(teams.map((team, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={team.commander.astronautId}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`crew-pick${isSelected ? ' crew-pick--selected' : ''}`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <span className="crew-pick__top">
                    <kbd className="title-kbd crew-pick__key">{localize(index + 1)}</kbd>
                    <span className={`crew-pick__check${isSelected ? ' is-on' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {localize(isSelected ? 'Chosen' : 'Choose')}
                    </span>
                  </span>

                  <span className="crew-pick__commander">
                    <Portrait seat={team.commander} size="lg" />
                    <span className="crew-pick__commander-text">
                      <span className="crew-pick__you">{localize("You are")}</span>
                      <span className="crew-pick__commander-name">{localize(team.commander.name)}</span>
                      <span className="crew-pick__role">{localize(team.commander.roleLabel)}</span>
                    </span>
                  </span>

                  <span className="crew-pick__crew-label">{localize("Your crew")}</span>
                  <span className="crew-pick__list">
                    {localize(team.seats.map((member) => (
                      <span key={member.role} className="crew-pick__member">
                        <Portrait seat={member} size="sm" />
                        <span className="crew-pick__who">
                          <span className="crew-pick__member-name">{localize(member.name)}</span>
                          <span className="crew-pick__role">{localize(member.roleLabel)}</span>
                        </span>
                      </span>
                    )))}
                  </span>
                </button>
              );
            }))}
          </div>

          <div className="title-actions">
            <button type="button" className="title-start" onClick={start} disabled={!selected}>
              {localize(selected ? (
                <>{localize(" Start Mission ")}<kbd className="title-kbd">{localize("Enter")}</kbd>
                </>
              ) : (
                'Choose a commander first'
              ))}
            </button>
          </div>
          <p className="title-keys">{localize("Keyboard: press 1 or 2 to choose a commander.")}</p>
        </section>

        <footer className="title-footer">
          <p>{localize("Based on real NASA data. Not made or endorsed by NASA.")}</p>
        </footer>
      </main>

      {localize(optionsOpen && <OptionsDialog onClose={() => setOptionsOpen(false)} />)}

      {localize(confirmNew && selected && savedMission && (
        <ConfirmDialog
          title={localize("Start a new mission?")}
          message={localize(`Your saved mission (Day ${savedMission.day}) will be replaced.`)}
          confirmLabel={localize("Start new mission")}
          cancelLabel={localize("Keep my mission")}
          onCancel={() => setConfirmNew(false)}
          onConfirm={() => {
            setConfirmNew(false);
            onStart(selected);
          }}
        />
      ))}
    </div>
  );
}
