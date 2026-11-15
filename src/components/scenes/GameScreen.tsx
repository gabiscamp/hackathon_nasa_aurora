import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { getMission, MISSIONS } from '../../data/missions';
import { advanceTo, fixedDay, missionLastDay, nextEventDay, openDay } from '../../engine/missionEngine';
import { checkCollapse } from '../../engine/survival';
import { saveCheckpoint } from '../../engine/checkpoint';
import { MissionOverlay } from '../panels/MissionOverlay';
import { DaySkipOverlay } from '../panels/DaySkipOverlay';
import { DaySummary } from '../narrative/DaySummary';
import { CrewStatusList } from '../panels/CrewStatusList';
import { Button } from '../ui/Button';
import { getAct } from '../panels/DayTracker';
import { PhaserGame } from '../../game/PhaserGame';
import { Hud } from '../hud/Hud';
import { gameEvents, EVENTS } from '../../game/events';
import { markerSpecs } from '../../game/missionMarkers';
import { startAlertLoop, stopAlertLoop } from '../../utils/sounds';
import type { RoomId } from '../../game/world/shipLayout';
import { ROOM_NAMES } from '../hud/LocationHint';
import { PauseMenu } from '../hud/PauseMenu';
import './GameScreen.css';
import { ExplorationSystem } from '../exploration/ExplorationSystem';


/** Missions that will open on `day` (preview for the "Begin Day" panel). */
function incomingTitles(day: number): string[] {
  const { openEvents, scheduled, completedMissions } = useMissionStore.getState();
  const ids = new Set<string>(openEvents);
  for (const s of scheduled) if (s.day <= day) ids.add(s.missionId);
  for (const m of MISSIONS) if (fixedDay(m) === day && !m.followUpOnly && !completedMissions.includes(m.id)) ids.add(m.id);
  return [...ids].flatMap((id) => {
    const m = getMission(id);
    return m && !completedMissions.includes(id) ? [`${m.icon} ${m.title}`] : [];
  });
}

interface GameScreenProps {
  onMainMenu: () => void;
  onOpenCredits: () => void;
  creditsOpen: boolean;
}

export function GameScreen({ onMainMenu, onOpenCredits, creditsOpen }: GameScreenProps) {
  const day = useGameStore((s) => s.day);
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const nextDay = useGameStore((s) => s.nextDay);
  const setDay = useGameStore((s) => s.setDay);
  const playerName = useGameStore((s) => s.playerName);
  const setMission = useMissionStore((s) => s.setMission);
  const clearMission = useMissionStore((s) => s.clearMission);
  const currentMission = useMissionStore((s) => s.currentMission);
  const openEvents = useMissionStore((s) => s.openEvents);
  const news = useMissionStore((s) => s.news);
  const [newsSeenDay, setNewsSeenDay] = useState(0);

  const [missionOpen, setMissionOpen] = useState(false);

  /** Day-skip overlay state */
  const [skipInfo, setSkipInfo] = useState<{
    daysSkipped: number;
    targetDay: number;
    act: 1 | 2 | 3;
  } | null>(null);

  const { label: actLabel } = getAct(day);
  const lastDay = missionLastDay();
  const briefingDay = Math.min(nextEventDay(day) ?? Math.max(day, lastDay), Math.max(day, lastDay));

  // One "!" per open problem; the alarm rings while an emergency is waiting.
  useEffect(() => {
    if (phase !== 'decision') {
      gameEvents.emit(EVENTS.SET_MISSION_MARKERS, []);
      stopAlertLoop();
      return;
    }
    gameEvents.emit(EVENTS.SET_MISSION_MARKERS, markerSpecs(openEvents));
    const emergency = openEvents.some((id) => getMission(id)?.severity === 'critical');
    if (emergency && !missionOpen) startAlertLoop();
    else stopAlertLoop();
  }, [phase, openEvents, missionOpen]);

  useEffect(() => () => stopAlertLoop(), []);

  // Every problem solved or left for tomorrow: the day ends.
  useEffect(() => {
    if (phase === 'decision' && openEvents.length === 0 && !missionOpen && !skipInfo) setPhase('summary');
  }, [phase, openEvents, missionOpen, skipInfo, setPhase]);

  useEffect(() => {
    const onMissionStart = (id?: string) => {
      const mission = id ? getMission(id) : undefined;
      if (!mission) return;
      stopAlertLoop();
      setMission(mission);
      setMissionOpen(true);
      gameEvents.emit('CAMERA_ZOOM_IN');
    };
    gameEvents.on(EVENTS.MISSION_START, onMissionStart);
    return () => {
      gameEvents.off(EVENTS.MISSION_START, onMissionStart);
    };
  }, [setMission]);

  const handleBeginDay = () => {
    const target = Math.max(day, Math.min(nextEventDay(day) ?? lastDay, lastDay));
    const skip = target - day;
    // "Try again from Day X" after a game over: the mission as it was when this act began.
    saveCheckpoint(getAct(target).act, day);
    // The engine runs each morning, skipped days too: the crew uses food, water and air,
    // chain failures hurt, jobs end, people rest, lasting problems apply.
    advanceTo(target);
    if (useMissionStore.getState().collapse) {
      useGameStore.getState().setScene('ending');
      return;
    }
    setDay(target);
    openDay(target);
    setSkipInfo({ daysSkipped: skip, targetDay: target, act: getAct(target).act });
  };

  const handleSkipDone = () => {
    setSkipInfo(null);
    setPhase('decision');
  };

  const handleMissionClosed = () => {
    setMissionOpen(false);
    clearMission();
    gameEvents.emit('CAMERA_ZOOM_OUT');
    // A choice took oxygen or health to 0 (or radiation to 100): the station is lost today.
    if (checkCollapse(day)) {
      stopAlertLoop();
      useGameStore.getState().setScene('ending');
    }
  };

  const handleEndDay = () => {
    // Game over, or mission over: Day 45, or Day 37 if the crew chose to go home early (problem 42).
    if (checkCollapse(day) || day >= lastDay) {
      useGameStore.getState().setScene('ending');
      return;
    }
    nextDay();
  };

  const openMissions = openEvents.flatMap((id) => {
    const m = getMission(id);
    return m ? [m] : [];
  });
  const anyEmergency = openMissions.some((m) => m.severity === 'critical');
  const roomList = [...new Set(openMissions.map((m) => ROOM_NAMES[m.room as RoomId] ?? m.room))].join(', ');

  return (
    <main className="game-screen">
      <h1 className="sr-only">Aurora Station</h1>
      <div className="game-stage">
        <PhaserGame className="station-view" />
        <Hud />
        <ExplorationSystem />
        <PauseMenu onMainMenu={onMainMenu} onOpenCredits={onOpenCredits} suspended={creditsOpen} />

        {phase === 'decision' && !missionOpen && !skipInfo && openMissions.length > 0 && (
          <div className={`game-hint-banner ${anyEmergency ? 'game-hint-banner--critical' : ''}`} data-read>
            {openMissions.length === 1 ? (
              <span>
                {openMissions[0].icon} {anyEmergency ? 'EMERGENCY! ' : ''}Go to {roomList} and press <kbd>E</kbd> to
                investigate!
              </span>
            ) : (
              <span>
                {anyEmergency ? 'EMERGENCY! ' : ''}
                {openMissions.length} problems today: {roomList}. Walk to each <strong>!</strong> and press <kbd>E</kbd>.
              </span>
            )}
          </div>
        )}

        {phase === 'decision' && !missionOpen && !skipInfo && news.length > 0 && newsSeenDay !== day && (
          <section className="game-news" role="status" aria-label="Station news" data-read>
            <h2 className="game-news__title">Station news</h2>
            <ul>
              {news.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <button type="button" className="game-news__ok" onClick={() => setNewsSeenDay(day)}>
              Got it
            </button>
          </section>
        )}

        {missionOpen && currentMission && (
          <MissionOverlay key={currentMission.id} onComplete={handleMissionClosed} />
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
            <h2 style={{ fontSize: 'var(--font-size-xl)' }}>Day {briefingDay}</h2>
            <p style={{ color: 'var(--accent-amber)' }}>{actLabel}</p>
            {incomingTitles(briefingDay).map((t) => (
              <p key={t} style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Incoming: {t}
              </p>
            ))}
            <CrewStatusList day={briefingDay} title="Your crew today" />
            <Button variant="primary" icon="▶️" onClick={handleBeginDay}>
              Begin Day
            </Button>
          </div>
        </div>
      )}

      {phase === 'summary' && (
        <div className="game-overlay">
          <DaySummary onNext={handleEndDay} />
        </div>
      )}

      {phase === 'result' && !currentMission && (
        <div className="game-overlay">
          <div className="panel day-briefing">
            <h2>Quiet Day</h2>
            <p style={{ color: 'var(--text-secondary)' }}>No events today. Resources ticked down as usual.</p>
            <Button variant="primary" onClick={() => setPhase('summary')}>
              Continue to Summary
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
