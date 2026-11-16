import { t as localize } from '../../i18n/translate';
import type { ReactNode } from 'react';
import { EnergyIcon, FoodIcon, OxygenIcon, RadiationIcon, WarningIcon, WaterIcon } from './HudIcons';
import { MenuIcon } from '../ui/MenuIcon';

const CONTROLS: { keys: string[]; action: string }[] = [
  { keys: ['W', 'A', 'S', 'D'], action: 'Walk (arrow keys work too)' },
  { keys: ['E'], action: 'Talk or use things' },
  { keys: ['M'], action: 'Open the ship map' },
  { keys: ['H'], action: 'Open this help' },
  { keys: ['L'], action: 'Read the screen aloud' },
  { keys: ['Esc'], action: 'Pause the game' },
];

const BARS: { icon: ReactNode; name: string; color: string; text: string }[] = [
  {
    icon: <FoodIcon size={22} />,
    name: 'Food',
    color: '#fb923c',
    text: 'Meals for the crew. It goes down every day. Below 20, everyone eats half portions and gets tired faster.',
  },
  {
    icon: <WaterIcon size={22} />,
    name: 'Water',
    color: '#4dc9f6',
    text: 'For drinking and washing. Below 30, the crew must save water (no showers!).',
  },
  {
    icon: <OxygenIcon size={22} />,
    name: 'Oxygen',
    color: '#2ecc71',
    text: 'The air the crew breathes. The machines need energy to make it. At 0, the station is lost!',
  },
  {
    icon: <RadiationIcon size={22} />,
    name: 'Radiation',
    color: '#facc15',
    text: 'Invisible energy from the Sun and space. Too much makes astronauts sick. Keep this bar LOW! At 100, everyone must leave.',
  },
  {
    icon: <EnergyIcon size={22} />,
    name: 'Energy',
    color: '#9b6cf2',
    text: 'Power from the solar panels. It runs every machine. At 0, the air and water machines stop!',
  },
];

/** "How to play" content: goal, missions, the five station bars and the keys. Used by the Help button and the pause menu. */
export function HowToPlay() {
  return (
    <div className="gm-help">
      <div className="gm-help__col">
        <section>
          <h3><MenuIcon name="mission" />{localize(" Your goal")}</h3>
          <p>{localize("Keep the station and the crew safe for 45 days near Mars.")}</p>
        </section>

        <section>
          <h3><MenuIcon name="resources" />{localize(" Missions")}</h3>
          <ol>
            <li>{localize(" An alarm rings and a red ")}<span className="gm-help__bang">!</span>{localize(" shows where to go (on the map too). ")}</li>
            <li>{localize(" Walk there and press ")}<kbd className="gm-kbd">{localize("E")}</kbd>.
            </li>
            <li>{localize("Choose what the crew should do. Every choice changes the station bars.")}</li>
          </ol>
        </section>

        <section>
          <h3><MenuIcon name="warning" />{localize(" How you can lose")}</h3>
          <p>{localize(" If ")}<strong>{localize("oxygen")}</strong>{localize(" reaches 0 or ")}<strong>{localize("radiation")}</strong>{localize(" reaches 100, the station is lost and the crew escapes in the capsule. One bad bar pulls the others down: no energy stops the air, and no air, water or food makes the crew sick a little more every day. ")}</p>
        </section>

        <section>
          <h3><MenuIcon name="controls" />{localize(" Keys")}</h3>
          <ul className="gm-controls">
            {localize(CONTROLS.map((c) => (
              <li key={c.action}>
                <span className="gm-controls__keys">
                  {localize(c.keys.map((k) => (
                    <kbd key={k} className="gm-kbd">
                      {localize(k)}
                    </kbd>
                  )))}
                </span>
                {localize(c.action)}
              </li>
            )))}
          </ul>
        </section>
      </div>

      <section>
        <h3><MenuIcon name="resources" />{localize(" Station bars")}</h3>
        <ul className="gm-help__bars">
          {localize(BARS.map((b) => (
            <li key={b.name}>
              <span className="gm-help__icon" style={{ color: b.color }}>
                {localize(b.icon)}
              </span>
              <span>
                <strong>{localize(b.name)}:</strong> {localize(b.text)}
              </span>
            </li>
          )))}
          <li>
            <span className="gm-help__icon" style={{ color: '#e74c3c' }}>
              <WarningIcon size={22} />
            </span>
            <span>{localize("A bar in danger turns red, blinks and shows a warning.")}</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
