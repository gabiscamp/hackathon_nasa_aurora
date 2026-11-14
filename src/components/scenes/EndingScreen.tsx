import { Button } from '../ui/Button';
import { ENDINGS } from '../../data/endings';
import { calculateEnding } from '../../engine/endingCalculator';
import './EndingScreen.css';

interface EndingScreenProps {
  playerName: string;
  resources: { energy: number; oxygen: number; shielding: number };
  onReplay: () => void;
}

const ENDING_ICONS = { good: '🎉', medium: '😮‍💨', bad: '💪' };

export function EndingScreen({ playerName, resources, onReplay }: EndingScreenProps) {
  const endingType = calculateEnding(resources);
  const ending = ENDINGS.find((e) => e.id === endingType)!;
  const avg = Math.round((resources.energy + resources.oxygen + resources.shielding) / 3);

  return (
    <div className="ending-screen">
      <div className="ending-container animate-fadeIn">
        <div className="ending-icon">{ENDING_ICONS[endingType]}</div>
        <h1 className="ending-title">{ending.title}</h1>
        <p className="ending-desc">
          {ending.description.replace('{name}', playerName)}
        </p>

        <div className="ending-stats">
          <div className="ending-stat">
            <span className="ending-stat-icon">⚡</span>
            <span className="ending-stat-label">Energy</span>
            <span className="ending-stat-value">{Math.round(resources.energy)}%</span>
          </div>
          <div className="ending-stat">
            <span className="ending-stat-icon">🫁</span>
            <span className="ending-stat-label">Oxygen</span>
            <span className="ending-stat-value">{Math.round(resources.oxygen)}%</span>
          </div>
          <div className="ending-stat">
            <span className="ending-stat-icon">🛡️</span>
            <span className="ending-stat-label">Shielding</span>
            <span className="ending-stat-value">{Math.round(resources.shielding)}%</span>
          </div>
          <div className="ending-stat overall">
            <span className="ending-stat-icon">📊</span>
            <span className="ending-stat-label">Overall</span>
            <span className="ending-stat-value">{avg}%</span>
          </div>
        </div>

        <div className="ending-nasa-box">
          <h3>🚀 You just lived what real astronauts face!</h3>
          <p>
            Everything in this game was based on real events from NASA missions:
            Apollo 13, MIR, the International Space Station, and the CHAPEA Mars simulation.
          </p>
          <p className="ending-source">
            Data sources: NASA DONKI, NASA ECLSS, NASA OSDR
          </p>
        </div>

        <Button variant="primary" size="lg" icon="🔄" onClick={onReplay}>
          {endingType === 'good' ? 'Play Again' : 'Try a Different Strategy'}
        </Button>
      </div>
    </div>
  );
}
