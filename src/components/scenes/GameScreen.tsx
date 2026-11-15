import { useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { useNarrativeStore } from '../../stores/useNarrativeStore';
import { pickMissionForDay } from '../../engine/eventResolver';
import { MISSIONS } from '../../data/missions';
import { MissionPanel } from '../panels/MissionPanel';
import { CommandConsole } from '../panels/CommandConsole';
import { DialogueBox } from '../narrative/DialogueBox';
import { DaySummary } from '../narrative/DaySummary';
import { Button } from '../ui/Button';
import { getAct } from '../panels/DayTracker';
import { PhaserGame } from '../../game/PhaserGame';
import { Hud } from '../hud/Hud';
import './GameScreen.css';

export function GameScreen() {
  const day = useGameStore((s) => s.day);
  const phase = useGameStore((s) => s.phase);
  const nextPhase = useGameStore((s) => s.nextPhase);
  const completedMissions = useMissionStore((s) => s.completedMissions);
  const setMission = useMissionStore((s) => s.setMission);
  const currentMission = useMissionStore((s) => s.currentMission);
  const currentDialogue = useNarrativeStore((s) => s.currentDialogue);

  const { act, label: actLabel } = getAct(day);

  // Pick a mission when entering briefing phase
  useEffect(() => {
    if (phase === 'briefing' && !currentMission) {
      const mission = pickMissionForDay(day, act, completedMissions, MISSIONS);
      if (mission) {
        setMission(mission);
      }
    }
  }, [phase, day, act, completedMissions, currentMission, setMission]);

  return (
    <div className="game-screen">
      <div className="game-stage">
        <PhaserGame className="station-view" />
        <Hud />

        {phase === 'decision' && (
          <div className="game-decision">
            <MissionPanel />
            <CommandConsole />
          </div>
        )}

        {phase === 'result' && (
          <div className="game-bottom">
            <DialogueBox />
            {!currentDialogue && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-sm)' }}>
                <Button variant="primary" size="sm" onClick={nextPhase}>
                  Continue to Summary
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Briefing overlay */}
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
            <Button variant="primary" icon="▶️" onClick={nextPhase}>
              Begin Day
            </Button>
          </div>
        </div>
      )}

      {/* Summary overlay */}
      {phase === 'summary' && (
        <div className="game-overlay">
          <DaySummary />
        </div>
      )}
    </div>
  );
}
