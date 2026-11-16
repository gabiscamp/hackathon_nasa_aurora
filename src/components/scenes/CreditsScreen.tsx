import { t as localize } from '../../i18n/translate';
import { LANGUAGE_LOCALES, useLanguage } from '../../i18n/language';
import { useEffect, useRef, useState } from 'react';
import { useSpaceWeatherStore, type SpaceWeatherStatus } from '../../stores/useSpaceWeatherStore';
import { travelDays } from '../../services/donki';
import { ASTRONAUTS } from '../../data/astronauts';
import { ASTRONAUT_PHOTOS } from '../../data/astronautPhotos';
import './CreditsScreen.css';

/**
 * Credits, NASA data sources and AI-use statement ("For parents and teachers").
 * Required by the Space Apps rules: cite data sources in-game, label archived data
 * as not live, and declare AI use in the in-game credits.
 *
 * Written with help from an AI assistant (Claude, Anthropic).
 */

/** TODO(team): add the names the team wants to show. Never add photos of members under 18. */
const TEAM_MEMBERS: string[] = [];

interface Source {
  name: string;
  url: string;
  use: string;
}

const NASA_SOURCES: Source[] = [
  {
    name: 'NASA DONKI (Space Weather Database)',
    url: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/',
    use: 'Real solar storms (CMEs) and when they reach Mars.',
  },
  {
    name: 'NASA Open APIs (api.nasa.gov)',
    url: 'https://api.nasa.gov/',
    use: 'How the game reads DONKI data: /DONKI/CME and /DONKI/GST.',
  },
  // TODO(team): add every other NASA source behind a fact shown in the game.
];

const TOOLS: Source[] = [
  { name: 'React', url: 'https://react.dev/', use: 'Menus, HUD and dialogue.' },
  { name: 'Phaser 3', url: 'https://phaser.io/', use: 'The station world and movement.' },
  { name: 'Zustand', url: 'https://zustand.docs.pmnd.rs/', use: 'Game state.' },
  { name: 'Vite + TypeScript', url: 'https://vite.dev/', use: 'Building the game.' },
  { name: 'Tailwind CSS', url: 'https://tailwindcss.com/', use: 'Styles.' },
  { name: 'Aseprite', url: 'https://www.aseprite.org/', use: 'Our team drew the astronaut sprites in it.' },
  { name: 'Lexend font (SIL Open Font License)', url: 'https://fonts.google.com/specimen/Lexend', use: 'All game text.' },
  { name: 'Web Audio API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API', use: 'Original procedural music and most sound effects.' },
  { name: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/', use: 'The original procedural sound design is released with no rights reserved.' },
];

const MAX_CMES_SHOWN = 5;

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(LANGUAGE_LOCALES[useLanguage.getState().language], { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function DataBadge({ status, fetchedAt }: { status: SpaceWeatherStatus; fetchedAt: string }) {
  if (status === 'live') {
    return <p className="credits-badge credits-badge--live">{localize("LIVE from NASA DONKI · checked ")}{localize(formatDay(fetchedAt))}</p>;
  }
  if (status === 'offline') {
    return (
      <p className="credits-badge credits-badge--offline">{localize(" NOT LIVE · saved NASA data from ")}{localize(formatDay(fetchedAt))}{localize(" (we could not reach NASA right now) ")}</p>
    );
  }
  return <p className="credits-badge">{localize("Asking NASA for new data…")}</p>;
}

interface CreditsScreenProps {
  onClose: () => void;
}

export function CreditsScreen({ onClose }: CreditsScreenProps) {
  const { status, data, load } = useSpaceWeatherStore();
  const [pendingLink, setPendingLink] = useState<Source | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    void load();
    closeRef.current?.focus();
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (pendingLink) setPendingLink(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingLink, onClose]);

  const strongest = data.storms.reduce<(typeof data.storms)[number] | null>(
    (best, s) => (best === null || s.maxKp > best.maxKp ? s : best),
    null,
  );

  const openPending = () => {
    if (pendingLink) window.open(pendingLink.url, '_blank', 'noopener,noreferrer');
    setPendingLink(null);
  };

  const linkButton = (source: Source) => (
    <button type="button" className="credits-link" onClick={() => setPendingLink(source)}>
      {localize(source.name)}
    </button>
  );

  return (
    <div
      className="credits-screen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="credits-panel">
        <header className="credits-header">
          <h1 id="credits-title">{localize("Credits & Sources")}</h1>
          <button ref={closeRef} type="button" className="credits-btn" onClick={onClose}>{localize(" Back ")}</button>
        </header>

        <div className="credits-body">
          <section>
            <h2>{localize("For parents and teachers")}</h2>
            <p>{localize("This game uses real space weather data from NASA. Here you can see what we used and why.")}</p>
          </section>

          <section>
            <h2>{localize("Solar storms heading to Mars")}</h2>
            <DataBadge status={status} fetchedAt={data.fetchedAt} />
            <p>{localize(" A ")}<strong>{localize("CME")}</strong>{localize(" is a giant cloud of hot gas thrown out by the Sun. Astronauts must hide from it, because it brings extra radiation. ")}</p>
            {localize(data.marsCmes.length === 0 ? (
              <p>{localize("No solar storms were heading to Mars in the last 30 days.")}</p>
            ) : (
              <ul className="credits-cmes">
                {localize(data.marsCmes.slice(0, MAX_CMES_SHOWN).map((cme) => (
                  <li key={cme.id} className="credits-cme">
                    <span className="credits-cme__route">{localize(" Left the Sun ")}<strong>{localize(formatDay(cme.leftSunAt))}</strong>{localize(" → reaches Mars ")}<strong>{localize(formatDay(cme.arrivesAt))}</strong>
                    </span>
                    <span className="credits-cme__facts">
                      {localize(travelDays(cme))}{localize(" days · ")}{localize(cme.speedKmS.toLocaleString(LANGUAGE_LOCALES[useLanguage.getState().language]))}{localize(" km/s ·")}{localize(' ')}
                      {localize(cme.glancingBlow ? 'Glancing blow (just grazes Mars)' : 'Direct hit')}
                    </span>
                  </li>
                )))}
              </ul>
            ))}
            <p className="credits-note">{localize(" DONKI found ")}{localize(data.totalCmes)}{localize(" CMEs in total; ")}{localize(data.marsCmes.length)}{localize(" of them were predicted to reach Mars. ")}{localize(strongest && ` The strongest storm at Earth reached Kp ${strongest.maxKp} on ${formatDay(strongest.startedAt)} (Kp goes from 0 to 9).`)}
            </p>
            <p className="credits-note">{localize(" DONKI data is for research. Official space weather forecasts come from NOAA's Space Weather Prediction Center. ")}</p>
          </section>

          <section>
            <h2>{localize("NASA data we used")}</h2>
            <ul className="credits-list">
              {localize(NASA_SOURCES.map((s) => (
                <li key={s.url}>
                  {localize(linkButton(s))}
                  <span>{localize(s.use)}</span>
                </li>
              )))}
            </ul>
          </section>

          <section>
            <h2>{localize("Astronaut photos")}</h2>
            <p>{localize("Official portraits by NASA photographers, in the public domain, from Wikimedia Commons.")}</p>
            <ul className="credits-list">
              {localize(ASTRONAUTS.filter((a) => ASTRONAUT_PHOTOS[a.id]).map((a) => {
                const photo = ASTRONAUT_PHOTOS[a.id];
                return (
                  <li key={a.id}>
                    {localize(linkButton({ name: a.name, url: photo.sourceUrl, use: '' }))}
                    <span>{localize(" Photo: ")}{localize(photo.author)} · {localize(photo.license)}
                    </span>
                  </li>
                );
              }))}
            </ul>
          </section>

          <section>
            <h2>{localize("Music and sound")}</h2>
            <p>{localize(" The opening cutscene uses \"Total War (Epic Action Cinematic Trailer Main)\" by AudioAtlant, supplied by the team under the Pixabay Content License. The ambient music, footsteps, robot and interface tones are generated by the game with the browser Web Audio API and released under CC0 1.0. The critical alarm uses the legacy alert MP3 restored from the project's first version; its original external source is not documented. ")}</p>
            {localize(linkButton({
              name: 'Opening soundtrack on Pixabay',
              url: 'https://pixabay.com/music/adventure-total-war-epic-action-cinematic-trailer-main-513668/',
              use: 'Opening cutscene soundtrack.',
            }))}
          </section>

          <section>
            <h2>{localize("Use of AI")}</h2>
            <p>{localize(" All the creative work is ours: our team came up with the idea, the game rules, the story, the missions and the design documents. No AI wrote them. An AI assistant (Claude, by Anthropic) only helped us write the code. ")}</p>
            <p>{localize(" The station map was made with an AI image tool (ChatGPT, by OpenAI). We started from a floor plan of the International Space Station and guided the tool step by step. In the game, the map shows an \"AI-generated map\" mark. ")}</p>
            <p>{localize(" Our team drew the astronaut characters by hand in Aseprite. We also tried ChatGPT to clean up the character art. ")}</p>
          </section>

          <section>
            <h2>{localize("Built with")}</h2>
            <ul className="credits-list">
              {localize(TOOLS.map((s) => (
                <li key={s.url}>
                  {localize(linkButton(s))}
                  <span>{localize(s.use)}</span>
                </li>
              )))}
            </ul>
          </section>

          <section>
            <h2>{localize("Made by")}</h2>
            {localize(TEAM_MEMBERS.length > 0 && <p className="credits-team">{localize(TEAM_MEMBERS.join(' · '))}</p>)}
            <p>{localize("Made by our team for the NASA Space Apps Challenge 2026.")}</p>
            <p className="credits-note">{localize("This is a student project. It is not made or endorsed by NASA.")}</p>
            <p className="credits-note">{localize(" The astronaut crews use the names of real astronauts to honor their work. The events in the game are made up, and the astronauts are not involved with this project. ")}</p>
          </section>
        </div>
      </div>

      {localize(pendingLink && (
        <div
          className="credits-confirm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="credits-confirm-text"
          onClick={(event) => {
            if (event.target === event.currentTarget) setPendingLink(null);
          }}
        >
          <div className="credits-confirm__box">
            <p id="credits-confirm-text">{localize(" This opens a website outside the game: ")}<strong>{localize(pendingLink.name)}</strong>{localize(". Ask a grown-up first. ")}</p>
            <div className="credits-confirm__actions">
              <button type="button" className="credits-btn" onClick={() => setPendingLink(null)}>{localize(" Stay here ")}</button>
              <button type="button" className="credits-btn credits-btn--primary" onClick={openPending}>{localize(" Open website ")}</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
