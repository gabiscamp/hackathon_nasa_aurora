import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useResourceStore, type Resources } from '../../stores/useResourceStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { pickMissionForDay } from '../../engine/eventResolver';
import { MISSIONS } from '../../data/missions';
import { MissionOverlay } from '../panels/MissionOverlay';
import { DaySkipOverlay } from '../panels/DaySkipOverlay';
import { DaySummary } from '../narrative/DaySummary';
import { Button } from '../ui/Button';
import { getAct } from '../panels/DayTracker';
import { PhaserGame } from '../../game/PhaserGame';
import { Hud } from '../hud/Hud';
import { gameEvents, EVENTS } from '../../game/events';
import { startAlertLoop, stopAlertLoop } from '../../utils/sounds';
import type { RoomId } from '../../game/world/shipLayout';
import { ROOM_NAMES } from '../hud/LocationHint';
import { PauseMenu } from '../hud/PauseMenu';
import './GameScreen.css';
import { ExplorationSystem } from '../exploration/ExplorationSystem';

/** Sorted list of days that have missions. */
const MISSION_DAYS = [
  1, 5, 7, 10, 12, 15, 17, 20, 23, 25,
  28, 32, 35, 38, 40, 42, 45, 47, 50, 53,
  55, 58, 60, 62, 65, 66, 68, 70, 72, 75,
  78, 80, 83, 85, 88, 90,
];

/** Return the next mission day >= currentDay (or null if past 90). */
function nextMissionDay(currentDay: number): number | null {
  for (const d of MISSION_DAYS) {
    if (d >= currentDay) return d;
  }
  return null;
}

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
  const setDay = useGameStore((s) => s.setDay);
  const playerName = useGameStore((s) => s.playerName);
  const completedMissions = useMissionStore((s) => s.completedMissions);
  const setMission = useMissionStore((s) => s.setMission);
  const currentMission = useMissionStore((s) => s.currentMission);
  const tick = useResourceStore((s) => s.tick);
  const tickDays = useResourceStore((s) => s.tickDays);

  const [missionOpen, setMissionOpen] = useState(false);
  const [dayStart, setDayStart] = useState<Resources>(() => ({ ...useResourceStore.getState() }));
  const [alertPlayed, setAlertPlayed] = useState('');

  /** Day-skip overlay state */
  const [skipInfo, setSkipInfo] = useState<{
    daysSkipped: number;
    targetDay: number;
    act: 1 | 2 | 3;
  } | null>(null);

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
    if (phase === 'decision' && !currentMission) {
      nextPhase();
    }
  }, [phase, currentMission, nextPhase]);

  useEffect(() => {
    if (phase === 'decision' && currentMission && alertPlayed !== currentMission.id) {
      const isCritical = currentMission.severity === 'critical';
      gameEvents.emit('SHOW_MISSION_MARKER', currentMission.room as RoomId, isCritical);
      setAlertPlayed(currentMission.id);
      if (isCritical) {
        startAlertLoop();
      }
    }
  }, [phase, currentMission, alertPlayed]);

  useEffect(() => {
    const onMissionStart = () => {
      stopAlertLoop();
      setMissionOpen(true);
      gameEvents.emit('CAMERA_ZOOM_IN');
      gameEvents.emit('REMOVE_MISSION_MARKER');
    };
    gameEvents.on(EVENTS.MISSION_START, onMissionStart);
    return () => { gameEvents.off(EVENTS.MISSION_START, onMissionStart); };
  }, []);

  const handleBeginDay = () => {
    const target = nextMissionDay(day);
    if (target !== null && target > day) {
      // Days need to be skipped
      const skip = target - day;
      const targetAct = getAct(target).act;
      tickDays(skip);
      setDay(target);
      // Re-pick mission for the new day
      const mission = pickMissionForDay(target, targetAct, completedMissions, MISSIONS);
      if (mission) setMission(mission);
      setSkipInfo({ daysSkipped: skip, targetDay: target, act: targetAct });
    } else {
      // Already on a mission day, just show the intro overlay (0 days skipped)
      const currentAct = getAct(day).act;
      setSkipInfo({ daysSkipped: 0, targetDay: day, act: currentAct });
    }
  };

  const handleSkipDone = () => {
    setDayStart({ ...useResourceStore.getState() });
    setSkipInfo(null);
    nextPhase(); // briefing -> decision
  };

  const handleMissionComplete = () => {
    setMissionOpen(false);
    gameEvents.emit('CAMERA_ZOOM_OUT');
    nextPhase();
  };

  const radiation = useResourceStore((s) => s.radiation);

  const handleEndDay = () => {
    tick();
    if (radiation >= 95) {
      useGameStore.getState().setScene('ending');
      return;
    }
    nextDay();
  };

  return (
    <main className="game-screen">
      <h1 className="sr-only">Aurora Station</h1>
      <div className="game-stage">
        <PhaserGame className="station-view" />
        <Hud />
        <ExplorationSystem />
        <PauseMenu onMainMenu={onMainMenu} onOpenCredits={onOpenCredits} suspended={creditsOpen} />

        {phase === 'decision' && !missionOpen && currentMission && (
          <div className={`game-hint-banner ${currentMission.severity === 'critical' ? 'game-hint-banner--critical' : ''}`} data-read>
            <span>{currentMission.icon} {currentMission.severity === 'critical' ? 'EMERGENCY! ' : ''}Go to {ROOM_NAMES[currentMission.room as RoomId] ?? currentMission.room} and <span className="keyboard-instruction">press <kbd>E</kbd></span><span className="touch-instruction">tap Interact</span> to investigate!</span>
          </div>
        )}

        {missionOpen && currentMission && (
          <MissionOverlay onComplete={handleMissionComplete} />
        )}

        {skipInfo && (
          <DaySkipOverlay
            daysSkipped={skipInfo.daysSkipped}
            targetDay={skipInfo.targetDay}
            act={skipInfo.act}
            commanderName={playerName}
            onContinue={handleSkipDone}
          />
        )}
      </div>

      {phase === 'briefing' && !skipInfo && (
        <div className="game-overlay">
          <div className="panel day-briefing">
            <h2 style={{ fontSize: 'var(--font-size-xl)' }}>Day {nextMissionDay(day) ?? day}</h2>
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
          <DaySummary before={dayStart} onNextDay={handleEndDay} />
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
    </main>
  );
}
