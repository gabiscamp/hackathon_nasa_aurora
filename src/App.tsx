import { lazy, Suspense } from 'react';
import { useGameStore } from './stores/useGameStore';
import { useResourceStore } from './stores/useResourceStore';
import { useCrewStore } from './stores/useCrewStore';

const TitleScreen = lazy(() => import('./components/scenes/TitleScreen').then(m => ({ default: m.TitleScreen })));
const MissionBriefing = lazy(() => import('./components/scenes/MissionBriefing').then(m => ({ default: m.MissionBriefing })));
const CrewIntro = lazy(() => import('./components/scenes/CrewIntro').then(m => ({ default: m.CrewIntro })));
const GameScreen = lazy(() => import('./components/scenes/GameScreen').then(m => ({ default: m.GameScreen })));
const EndingScreen = lazy(() => import('./components/scenes/EndingScreen').then(m => ({ default: m.EndingScreen })));

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0e1a',
      color: '#e2e8f0',
      fontSize: '1.5rem',
    }}>
      Loading... 🚀
    </div>
  );
}

export default function App() {
  const scene = useGameStore((s) => s.scene);
  const playerName = useGameStore((s) => s.playerName);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const setScene = useGameStore((s) => s.setScene);
  const resetGame = useGameStore((s) => s.resetGame);
  const food = useResourceStore((s) => s.food);
  const health = useResourceStore((s) => s.health);
  const satisfaction = useResourceStore((s) => s.satisfaction);
  const resetResources = useResourceStore((s) => s.reset);
  const resetCrew = useCrewStore((s) => s.reset);

  const handleStart = (name: string) => {
    setPlayerName(name);
    setScene('briefing');
  };

  const handleReplay = () => {
    resetGame();
    resetResources();
    resetCrew();
  };

  return (
    <Suspense fallback={<LoadingScreen />}>
      {scene === 'title' && <TitleScreen onStart={handleStart} />}
      {scene === 'briefing' && (
        <MissionBriefing playerName={playerName} onContinue={() => setScene('crew-intro')} />
      )}
      {scene === 'crew-intro' && (
        <CrewIntro playerName={playerName} onContinue={() => setScene('game')} />
      )}
      {scene === 'game' && <GameScreen />}
      {scene === 'ending' && (
        <EndingScreen playerName={playerName} resources={{ food, health, satisfaction }} onReplay={handleReplay} />
      )}
    </Suspense>
  );
}
