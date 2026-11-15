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
];

const MAX_CMES_SHOWN = 5;

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function DataBadge({ status, fetchedAt }: { status: SpaceWeatherStatus; fetchedAt: string }) {
  if (status === 'live') {
    return <p className="credits-badge credits-badge--live">LIVE from NASA DONKI · checked {formatDay(fetchedAt)}</p>;
  }
  if (status === 'offline') {
    return (
      <p className="credits-badge credits-badge--offline">
        NOT LIVE · saved NASA data from {formatDay(fetchedAt)} (we could not reach NASA right now)
      </p>
    );
  }
  return <p className="credits-badge">Asking NASA for new data…</p>;
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
      {source.name}
    </button>
  );

  return (
    <div className="credits-screen" role="dialog" aria-modal="true" aria-labelledby="credits-title">
      <div className="credits-panel">
        <header className="credits-header">
          <h1 id="credits-title">Credits &amp; Sources</h1>
          <button ref={closeRef} type="button" className="credits-btn" onClick={onClose}>
            Back
          </button>
        </header>

        <div className="credits-body">
          <section>
            <h2>For parents and teachers</h2>
            <p>This game uses real space weather data from NASA. Here you can see what we used and why.</p>
          </section>

          <section>
            <h2>Solar storms heading to Mars</h2>
            <DataBadge status={status} fetchedAt={data.fetchedAt} />
            <p>
              A <strong>CME</strong> is a giant cloud of hot gas thrown out by the Sun. Astronauts must hide from it, because it brings
              extra radiation.
            </p>
            {data.marsCmes.length === 0 ? (
              <p>No solar storms were heading to Mars in the last 30 days.</p>
            ) : (
              <ul className="credits-cmes">
                {data.marsCmes.slice(0, MAX_CMES_SHOWN).map((cme) => (
                  <li key={cme.id} className="credits-cme">
                    <span className="credits-cme__route">
                      Left the Sun <strong>{formatDay(cme.leftSunAt)}</strong> → reaches Mars <strong>{formatDay(cme.arrivesAt)}</strong>
                    </span>
                    <span className="credits-cme__facts">
                      {travelDays(cme)} days · {cme.speedKmS.toLocaleString('en-US')} km/s ·{' '}
                      {cme.glancingBlow ? 'Glancing blow (just grazes Mars)' : 'Direct hit'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="credits-note">
              DONKI found {data.totalCmes} CMEs in total; {data.marsCmes.length} of them were predicted to reach Mars.
              {strongest && ` The strongest storm at Earth reached Kp ${strongest.maxKp} on ${formatDay(strongest.startedAt)} (Kp goes from 0 to 9).`}
            </p>
            <p className="credits-note">
              DONKI data is for research. Official space weather forecasts come from NOAA's Space Weather Prediction Center.
            </p>
          </section>

          <section>
            <h2>NASA data we used</h2>
            <ul className="credits-list">
              {NASA_SOURCES.map((s) => (
                <li key={s.url}>
                  {linkButton(s)}
                  <span>{s.use}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Astronaut photos</h2>
            <p>Official portraits by NASA photographers, in the public domain, from Wikimedia Commons.</p>
            <ul className="credits-list">
              {ASTRONAUTS.filter((a) => ASTRONAUT_PHOTOS[a.id]).map((a) => {
                const photo = ASTRONAUT_PHOTOS[a.id];
                return (
                  <li key={a.id}>
                    {linkButton({ name: a.name, url: photo.sourceUrl, use: '' })}
                    <span>
                      Photo: {photo.author} · {photo.license}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h2>Use of AI</h2>
            <p>
              All the creative work is ours: our team came up with the idea, the game rules, the story, the missions and the
              design documents. No AI wrote them. An AI assistant (Claude, by Anthropic) only helped us write the code.
            </p>
            <p>
              The station map was made with an AI image tool (ChatGPT, by OpenAI). We started from a floor plan of the International Space
              Station and guided the tool step by step. In the game, the map shows an "AI-generated map" mark.
            </p>
            <p>
              Our team drew the astronaut characters by hand in Aseprite. We also tried ChatGPT to clean up the
              character art.
            </p>
          </section>

          <section>
            <h2>Built with</h2>
            <ul className="credits-list">
              {TOOLS.map((s) => (
                <li key={s.url}>
                  {linkButton(s)}
                  <span>{s.use}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Made by</h2>
            {TEAM_MEMBERS.length > 0 && <p className="credits-team">{TEAM_MEMBERS.join(' · ')}</p>}
            <p>Made by our team for the NASA Space Apps Challenge 2026.</p>
            <p className="credits-note">This is a student project. It is not made or endorsed by NASA.</p>
            <p className="credits-note">
              The astronaut crews use the names of real astronauts to honor their work. The events in the game are made up, and the
              astronauts are not involved with this project.
            </p>
          </section>
        </div>
      </div>

      {pendingLink && (
        <div className="credits-confirm" role="alertdialog" aria-modal="true" aria-labelledby="credits-confirm-text">
          <div className="credits-confirm__box">
            <p id="credits-confirm-text">
              This opens a website outside the game: <strong>{pendingLink.name}</strong>. Ask a grown-up first.
            </p>
            <div className="credits-confirm__actions">
              <button type="button" className="credits-btn" onClick={() => setPendingLink(null)}>
                Stay here
              </button>
              <button type="button" className="credits-btn credits-btn--primary" onClick={openPending}>
                Open website
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
