import { Button } from '../ui/Button';
import './EndingScreen.css';

interface EndingScreenProps {
  playerName: string;
  resources: { food: number; health: number; satisfaction: number };
  onReplay: () => void;
}

export function EndingScreen({ playerName, resources, onReplay }: EndingScreenProps) {
  const avg = Math.round((resources.food + resources.health + resources.satisfaction) / 3);
  const endingType = avg > 30 ? 'good' : avg > 10 ? 'medium' : 'bad';

  const endings = {
    good: {
      icon: '🎉',
      title: 'Mission Complete!',
      desc: `Congratulations, Commander ${playerName}! The return ship has docked. Your crew is healthy and the station is in good shape. The data you collected will help future Mars missions.`,
    },
    medium: {
      icon: '😮‍💨',
      title: 'You Survived!',
      desc: `Commander ${playerName}, the return ship arrived just in time. Your crew made it, but barely. Resources were running dangerously low. Next time, manage them more carefully.`,
    },
    bad: {
      icon: '💪',
      title: 'A Tough Mission',
      desc: `Commander ${playerName}, the mission was hard and some things went wrong. But you learned something important: in space, every decision matters. The real astronauts know this. Try again?`,
    },
  };

  const ending = endings[endingType];

  return (
    <div className="ending-screen">
      <div className="ending-container animate-fadeIn">
        <div className="ending-icon">{ending.icon}</div>
        <h1 className="ending-title">{ending.title}</h1>
        <p className="ending-desc">{ending.desc}</p>

        <div className="ending-stats">
          <div className="ending-stat">
            <span className="ending-stat-icon">🍽</span>
            <span>Food: {Math.round(resources.food)}</span>
          </div>
          <div className="ending-stat">
            <span className="ending-stat-icon">❤️</span>
            <span>Health: {Math.round(resources.health)}</span>
          </div>
          <div className="ending-stat">
            <span className="ending-stat-icon">😊</span>
            <span>Morale: {Math.round(resources.satisfaction)}</span>
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', textAlign: 'center', marginTop: 16 }}>
          Everything in this game was based on real NASA data and events.
        </p>

        <Button variant="primary" onClick={onReplay}>
          Play Again
        </Button>
      </div>
    </div>
  );
}
