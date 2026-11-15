import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useResourceStore } from '../../stores/useResourceStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { pickMissionForDay } from '../../engine/eventResolver';
import { MISSIONS } from '../../data/missions';
import { MissionOverlay } from '../panels/MissionOverlay';
import { DaySummary } from '../narrative/DaySummary';
import { Button } from '../ui/Button';
import { getAct } from '../panels/DayTracker';
import { PhaserGame } from '../../game/PhaserGame';
import { Hud } from '../hud/Hud';
import { gameEvents, EVENTS } from '../../game/events';
import { playAlertSound } from '../../utils/sounds';
import type { RoomId } from '../../game/world/shipLayout';
import { ROOM_NAMES } from '../hud/LocationHint';
import { PauseMenu } from '../hud/PauseMenu';
import './GameScreen.css';
import { ExplorationSystem } from '../exploration/ExplorationSystem';

interface GameScreenProps {
  onMainMenu: () => void;
  onOpenCredits: () => void;
  creditsOpen: boolean;
}

export function GameScreen({ onMainMenu, onOpenCredits, creditsOpen }: GameScreenProps) {
  const day = useGameStore((s) => s.day);
  const phase = useGameStore((s) => s.phase);
  const nextPhase = useGameStore((s) => s.nextPhase);
  const nextDay = useGameStore((s) => s.nextDay);
  const completedMissions = useMissionStore((s) => s.completedMissions);
  const setMission = useMissionStore((s) => s.setMission);
  const currentMission = useMissionStore((s) => s.currentMission);
  const tick = useResourceStore((s) => s.tick);

  const [missionOpen, setMissionOpen] = useState(false);
  const [alertPlayed, setAlertPlayed] = useState('');

  const { act, label: actLabel } = getAct(day);

  useEffect(() => {
    if (phase === 'briefing' && !currentMission) {
      const mission = pickMissionForDay(day, act, completedMissions, MISSIONS);
      if (mission) {
        setMission(mission);
      }
    }
  }, [phase, day, act, completedMissions, currentMission, setMission]);

  useEffect(() => {
    if (phase === 'decision' && currentMission && alertPlayed !== currentMission.id) {
      gameEvents.emit('SHOW_MISSION_MARKER', currentMission.room as RoomId);
      setAlertPlayed(currentMission.id);
      playAlertSound();
      const timer = setTimeout(() => playAlertSound(), 3000);
      return () => clearTimeout(timer);
    }
  }, [phase, currentMission, alertPlayed]);

  useEffect(() => {
    const onMissionStart = () => {
      setMissionOpen(true);
      gameEvents.emit('CAMERA_ZOOM_IN');
      gameEvents.emit('REMOVE_MISSION_MARKER');
    };
    gameEvents.on(EVENTS.MISSION_START, onMissionStart);
    return () => { gameEvents.off(EVENTS.MISSION_START, onMissionStart); };
  }, []);

  const handleBeginDay = () => {
    nextPhase();
  };

  const handleMissionComplete = () => {
    setMissionOpen(false);
    gameEvents.emit('CAMERA_ZOOM_OUT');
    nextPhase();
  };

  const handleEndDay = () => {
    tick();
    nextDay();
  };

  return (
    <div className="game-screen">
      <div className="game-stage">
        <PhaserGame className="station-view" />
        <Hud />
        <ExplorationSystem />
        <PauseMenu onMainMenu={onMainMenu} onOpenCredits={onOpenCredits} suspended={creditsOpen} />

        {phase === 'decision' && !missionOpen && currentMission && (
          <div className="game-hint-banner">
            <span>{currentMission.icon} Go to {ROOM_NAMES[currentMission.room as RoomId] ?? currentMission.room} and press <kbd>E</kbd> to investigate!</span>
          </div>
        )}

        {missionOpen && currentMission && (
          <MissionOverlay onComplete={handleMissionComplete} />
        )}
      </div>

      {phase === 'briefing' && (
        <div className="game-overlay">
          <div className="panel day-briefing">
            <h2 style={{ fontSize: 'var(--font-size-xl)' }}>Day {day}</h2>
            <p style={{ color: 'var(--accent-amber)' }}>{actLabel}</p>
            {currentMission && (
              <p style={{ color: 'var(--text-secondary)' }}>
                {currentMission.icon} Incoming: {currentMission.title}
              </p>
            )}
            <Button variant="primary" icon="▶️" onClick={handleBeginDay}>
              Begin Day
            </Button>
          </div>
        </div>
      )}

      {phase === 'summary' && (
        <div className="game-overlay">
          <DaySummary />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <Button variant="primary" onClick={handleEndDay}>
              Next Day
            </Button>
          </div>
        </div>
      )}

      {phase === 'result' && !currentMission && (
        <div className="game-overlay">
          <div className="panel day-briefing">
            <h2>Quiet Day</h2>
            <p style={{ color: 'var(--text-secondary)' }}>No events today. Resources ticked down as usual.</p>
            <Button variant="primary" onClick={nextPhase}>
              Continue to Summary
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
