import type { ReactNode } from 'react';
import { EnergyIcon, FoodIcon, OxygenIcon, RadiationIcon, WarningIcon, WaterIcon } from './HudIcons';

const CONTROLS: { keys: string[]; action: string }[] = [
  { keys: ['W', 'A', 'S', 'D'], action: 'Walk (arrow keys work too)' },
  { keys: ['E'], action: 'Talk or use things' },
  { keys: ['M'], action: 'Open the ship map' },
  { keys: ['H'], action: 'Open this help' },
  { keys: ['Esc'], action: 'Pause the game' },
];

const BARS: { icon: ReactNode; name: string; color: string; text: string }[] = [
  {
    icon: <FoodIcon size={22} />,
    name: 'Food',
    color: '#fb923c',
    text: 'Meals for the crew. It goes down a little every day.',
  },
  {
    icon: <WaterIcon size={22} />,
    name: 'Water',
    color: '#4dc9f6',
    text: 'For drinking and washing. It goes down every day too.',
  },
  {
    icon: <OxygenIcon size={22} />,
    name: 'Oxygen',
    color: '#2ecc71',
    text: 'The air the crew breathes. The machines need energy to make it.',
  },
  {
    icon: <RadiationIcon size={22} />,
    name: 'Radiation',
    color: '#facc15',
    text: 'Invisible energy from the Sun and space. Too much makes astronauts sick. Keep this bar LOW!',
  },
  {
    icon: <EnergyIcon size={22} />,
    name: 'Energy',
    color: '#9b6cf2',
    text: 'Power from the solar panels. It runs every machine on the station.',
  },
];

/** "How to play" content: goal, missions, the five station bars and the keys. Used by the Help button and the pause menu. */
export function HowToPlay() {
  return (
    <div className="gm-help">
      <div className="gm-help__col">
        <section>
          <h3>Your goal</h3>
          <p>Keep the station and the crew safe for 90 days near Mars.</p>
        </section>

        <section>
          <h3>Missions</h3>
          <ol>
            <li>
              An alarm rings and a red <span className="gm-help__bang">!</span> shows where to go (on the map too).
            </li>
            <li>
              Walk there and press <kbd className="gm-kbd">E</kbd>.
            </li>
            <li>Choose what the crew should do. Every choice changes the station bars.</li>
          </ol>
        </section>

        <section>
          <h3>Keys</h3>
          <ul className="gm-controls">
            {CONTROLS.map((c) => (
              <li key={c.action}>
                <span className="gm-controls__keys">
                  {c.keys.map((k) => (
                    <kbd key={k} className="gm-kbd">
                      {k}
                    </kbd>
                  ))}
                </span>
                {c.action}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <h3>Station bars</h3>
        <ul className="gm-help__bars">
          {BARS.map((b) => (
            <li key={b.name}>
              <span className="gm-help__icon" style={{ color: b.color }}>
                {b.icon}
              </span>
              <span>
                <strong>{b.name}:</strong> {b.text}
              </span>
            </li>
          ))}
          <li>
            <span className="gm-help__icon" style={{ color: '#e74c3c' }}>
              <WarningIcon size={22} />
            </span>
            <span>A bar in danger turns red, blinks and shows a warning.</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
