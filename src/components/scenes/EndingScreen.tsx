import { Button } from '../ui/Button';
import { ENDINGS } from '../../data/endings';
import { calculateEnding } from '../../engine/endingCalculator';
import { stationScore, type Resources } from '../../stores/useResourceStore';
import './EndingScreen.css';

interface EndingScreenProps {
  playerName: string;
  resources: Resources;
  onReplay: () => void;
  onOpenCredits: () => void;
}

const ENDING_ICONS: Record<string, string> = { good: '🎉', medium: '😮‍💨', bad: '💪', radiation: '☢️' };
// TODO: replace with real asset — emoji icons on the ending screen.
const ENDING_STATS = [
  { key: 'food', icon: '🍎', label: 'Food' },
  { key: 'water', icon: '💧', label: 'Water' },
  { key: 'oxygen', icon: '🫁', label: 'Oxygen' },
  { key: 'radiation', icon: '☢️', label: 'Radiation' },
  { key: 'energy', icon: '⚡', label: 'Energy' },
] as const;

export function EndingScreen({ playerName, resources, onReplay, onOpenCredits }: EndingScreenProps) {
  const endingType = calculateEnding(resources);
  const ending = ENDINGS.find((e) => e.id === endingType)!;
  const avg = Math.round(stationScore(resources));

  return (
    <div className="ending-screen">
      <div className="ending-container animate-fadeIn">
        <div className="ending-icon">{ENDING_ICONS[endingType]}</div>
        <h1 className="ending-title">{ending.title}</h1>
        <p className="ending-desc">
          {ending.description.replace('{name}', playerName)}
        </p>

        <div className="ending-stats">
          {ENDING_STATS.map((stat) => (
            <div key={stat.key} className="ending-stat">
              <span className="ending-stat-icon">{stat.icon}</span>
              <span className="ending-stat-label">{stat.label}</span>
              <span className="ending-stat-value">{Math.round(resources[stat.key])}%</span>
            </div>
          ))}
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
          <button type="button" className="ending-credits" onClick={onOpenCredits}>
            See credits &amp; NASA sources
          </button>
        </div>

        <Button variant="primary" size="lg" icon="🔄" onClick={onReplay}>
          {endingType === 'good' ? 'Play Again' : 'Try a Different Strategy'}
        </Button>
      </div>
    </div>
  );
}
