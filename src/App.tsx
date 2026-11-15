import { lazy, Suspense, useEffect, useState } from 'react';
import { A11yDock, useReadShortcut } from './components/ui/A11yDock';
import { OrientationGuard } from './components/ui/OrientationGuard';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from './stores/useGameStore';
import { useResourceStore } from './stores/useResourceStore';
import { useCrewStore } from './stores/useCrewStore';
import { useSpaceWeatherStore } from './stores/useSpaceWeatherStore';
import { getTeam, type CrewTeam } from './data/crews';
import { useMissionStore } from './stores/useMissionStore';
import { useExplorationStore } from './stores/useExplorationStore';

const TitleScreen = lazy(() => import('./components/scenes/TitleScreen').then(m => ({ default: m.TitleScreen })));
const MissionBriefing = lazy(() => import('./components/scenes/MissionBriefing').then(m => ({ default: m.MissionBriefing })));
const CrewIntro = lazy(() => import('./components/scenes/CrewIntro').then(m => ({ default: m.CrewIntro })));
const GameScreen = lazy(() => import('./components/scenes/GameScreen').then(m => ({ default: m.GameScreen })));
const CreditsScreen = lazy(() => import('./components/scenes/CreditsScreen').then(m => ({ default: m.CreditsScreen })));
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
  useReadShortcut();
  const scene = useGameStore((s) => s.scene);
  const playerName = useGameStore((s) => s.playerName);
  const crewId = useGameStore((s) => s.crewId);
  const day = useGameStore((s) => s.day);
  const resumeScene = useGameStore((s) => s.resumeScene);
  const startMission = useGameStore((s) => s.startMission);
  const goHome = useGameStore((s) => s.goHome);
  const resumeMission = useGameStore((s) => s.resumeMission);
  const selectTeam = useCrewStore((s) => s.selectTeam);
  const resetMissions = useMissionStore((s) => s.reset);
  const resetExploration = useExplorationStore((s) => s.reset);
  const setScene = useGameStore((s) => s.setScene);
  const resetGame = useGameStore((s) => s.resetGame);
  // Ending screen reads all resources (mission system from main: 7 resources).
  const resources = useResourceStore(
    useShallow((s) => ({
      food: s.food,
      water: s.water,
      energy: s.energy,
      oxygen: s.oxygen,
      health: s.health,
      satisfaction: s.satisfaction,
      radiation: s.radiation,
    })),
  );
  const resetResources = useResourceStore((s) => s.reset);
  const resetCrew = useCrewStore((s) => s.reset);
  const loadSpaceWeather = useSpaceWeatherStore((s) => s.load);
  const [showCredits, setShowCredits] = useState(false);

  // Ask NASA DONKI for space weather once at start; falls back to saved data if offline.
  useEffect(() => {
    void loadSpaceWeather();
  }, [loadSpaceWeather]);

  const handleStart = (team: CrewTeam) => {
    resetResources();
    resetMissions();
    resetExploration();
    selectTeam(team.id);
    startMission(team.id, team.commander.name);
  };

  // A mission left with "Main menu" can be continued from the home screen.
  const savedMission =
    crewId && resumeScene ? { commanderName: getTeam(crewId).commander.name, day } : null;

  const handleReplay = () => {
    resetGame();
    resetResources();
    resetCrew();
    resetMissions();
    resetExploration();
  };

  return (
    <Suspense fallback={<LoadingScreen />}>
      <OrientationGuard />
      {/* Settings on story screens (title and game have their own entry points). */}
      {(scene === 'briefing' || scene === 'crew-intro' || scene === 'ending') && <A11yDock />}
      {scene === 'title' && <TitleScreen
          onStart={handleStart}
          onOpenCredits={() => setShowCredits(true)}
          savedMission={savedMission}
          onContinueMission={resumeMission}
          creditsOpen={showCredits}
        />}
      {scene === 'briefing' && (
        <MissionBriefing playerName={playerName} onContinue={() => setScene('crew-intro')} onBack={goHome} />
      )}
      {scene === 'crew-intro' && (
        <CrewIntro playerName={playerName} onContinue={() => setScene('game')} onBack={() => setScene('briefing')} />
      )}
      {scene === 'game' && (
        <GameScreen onMainMenu={goHome} onOpenCredits={() => setShowCredits(true)} creditsOpen={showCredits} />
      )}
      {scene === 'ending' && (
        <EndingScreen playerName={playerName} resources={resources} onReplay={handleReplay} onOpenCredits={() => setShowCredits(true)} />
      )}
      {showCredits && <CreditsScreen onClose={() => setShowCredits(false)} />}
    </Suspense>
  );
}
