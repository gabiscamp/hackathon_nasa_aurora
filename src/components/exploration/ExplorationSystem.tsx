import { t as localize } from '../../i18n/translate';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EXPLORATION_REPORTS, RISK_LABELS, type ExplorationOption } from '../../data/exploration';
import { EVENTS, gameEvents } from '../../game/events';
import { useExplorationStore } from '../../stores/useExplorationStore';
import { useResourceStore } from '../../stores/useResourceStore';
import { useGameStore } from '../../stores/useGameStore';
import { missionLastDay } from '../../engine/missionEngine';
import { playExplorationLaunch, playExplorationReturn, playMedalSound } from '../../utils/sounds';
import { RobotPortrait } from './RobotPortrait';
import './ExplorationSystem.css';

function missionDays(mission: ExplorationOption): number {
  return Math.ceil(mission.durationHours / 24);
}

function formatDays(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

function MissionDetails({ mission }: { mission: ExplorationOption }) {
  return (
    <>
      <span className={`exploration-risk exploration-risk--${mission.risk}`}>{localize(RISK_LABELS[mission.risk])}</span>
      <h3>{localize(mission.title)}</h3>
      <p>{localize(mission.description)}</p>
      <dl className="exploration-stats">
        <div><dt>{localize("Time")}</dt><dd>{localize(formatDays(missionDays(mission)))}</dd></div>
        <div><dt>{localize("Success")}</dt><dd>{localize(Math.round(mission.successChance * 100))}%</dd></div>
        <div><dt>{localize("Cost")}</dt><dd>{localize(mission.cost.energy)}{localize(" energy · ")}{localize(mission.cost.water)}{localize(" water")}</dd></div>
        <div><dt>{localize("Reward")}</dt><dd>{localize("up to ")}{localize(mission.reward.minerals)}{localize(" minerals")}</dd></div>
      </dl>
    </>
  );
}

export function ExplorationSystem() {
  const status = useExplorationStore((state) => state.status);
  const options = useExplorationStore((state) => state.options);
  const active = useExplorationStore((state) => state.active);
  const unlockedIds = useExplorationStore((state) => state.unlockedReportIds);
  const minerals = useExplorationStore((state) => state.minerals);
  const lastOutcome = useExplorationStore((state) => state.lastOutcome);
  const celebrationPending = useExplorationStore((state) => state.celebrationPending);
  const openMissionMenu = useExplorationStore((state) => state.openMissionMenu);
  const clearOptions = useExplorationStore((state) => state.clearOptions);
  const startExploration = useExplorationStore((state) => state.startExploration);
  const resolveExploration = useExplorationStore((state) => state.resolveExploration);
  const clearOutcome = useExplorationStore((state) => state.clearOutcome);
  const dismissCelebration = useExplorationStore((state) => state.dismissCelebration);
  const water = useResourceStore((state) => state.water);
  const energy = useResourceStore((state) => state.energy);
  const applyDelta = useResourceStore((state) => state.applyDelta);
  const day = useGameStore((state) => state.day);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const worldPausedByExploration = useRef(false);

  const menuOpen = status === 'aboard' && options.length > 0;

  useEffect(() => {
    const onRobotInteract = () => {
      if (useExplorationStore.getState().status !== 'aboard') return;
      // Never on top of another window (a mission, the pause menu, the map, the day summary).
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      openMissionMenu();
      if (!worldPausedByExploration.current) {
        worldPausedByExploration.current = true;
        gameEvents.emit(EVENTS.MENU_OPENED);
      }
    };
    gameEvents.on(EVENTS.ROBOT_INTERACT, onRobotInteract);
    return () => { gameEvents.off(EVENTS.ROBOT_INTERACT, onRobotInteract); };
  }, [openMissionMenu]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'r' || event.repeat) return;
      if (useExplorationStore.getState().status !== 'aboard') return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      gameEvents.emit(EVENTS.ROBOT_INTERACT);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!active) return;
    const outcome = resolveExploration(day);
    if (!outcome?.succeeded) return;
    applyDelta({
      water: outcome.mission.reward.water,
      energy: outcome.mission.reward.energy,
    });
  }, [active, day, applyDelta, resolveExploration]);

  useEffect(() => {
    if (lastOutcome && !worldPausedByExploration.current) {
      playExplorationReturn(lastOutcome.succeeded);
      worldPausedByExploration.current = true;
      gameEvents.emit(EVENTS.MENU_OPENED);
    }
  }, [lastOutcome]);

  useEffect(() => {
    if (celebrationPending) playMedalSound();
  }, [celebrationPending]);

  const unlockedReports = useMemo(
    () => EXPLORATION_REPORTS.filter((report) => unlockedIds.includes(report.id)),
    [unlockedIds],
  );

  const closeMenu = () => {
    clearOptions();
    if (worldPausedByExploration.current) {
      worldPausedByExploration.current = false;
      gameEvents.emit(EVENTS.MENU_CLOSED);
    }
  };

  const launch = (mission: ExplorationOption) => {
    if (water < mission.cost.water || energy < mission.cost.energy) return;
    setDetailsOpen(false);
    playExplorationLaunch();
    applyDelta({ water: -mission.cost.water, energy: -mission.cost.energy });
    startExploration(mission, day);
    if (worldPausedByExploration.current) {
      worldPausedByExploration.current = false;
      gameEvents.emit(EVENTS.MENU_CLOSED);
    }
  };

  const openDetails = () => {
    setDetailsOpen(true);
    if (!worldPausedByExploration.current) {
      worldPausedByExploration.current = true;
      gameEvents.emit(EVENTS.MENU_OPENED);
    }
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    if (worldPausedByExploration.current) {
      worldPausedByExploration.current = false;
      gameEvents.emit(EVENTS.MENU_CLOSED);
    }
  };

  const closeOutcome = () => {
    setDetailsOpen(false);
    clearOutcome();
    if (worldPausedByExploration.current) {
      worldPausedByExploration.current = false;
      gameEvents.emit(EVENTS.MENU_CLOSED);
    }
  };

  const receiveMedal = () => {
    setDetailsOpen(false);
    dismissCelebration();
    clearOutcome();
    if (worldPausedByExploration.current) {
      worldPausedByExploration.current = false;
      gameEvents.emit(EVENTS.MENU_CLOSED);
    }
  };

  return (
    <>
      {localize(status === 'aboard' && (
        <button
          className="robot-dock-button"
          type="button"
          onClick={() => gameEvents.emit(EVENTS.ROBOT_INTERACT)}
          aria-label={localize("Open the AUR-1 robot missions (R)")}
        >
          <span className="robot-dock-button__dot" aria-hidden="true" />
          <span><strong>{localize("AUR-1")}</strong><small>{localize("Robot missions")}</small></span>
          <kbd>{localize("R")}</kbd>
        </button>
      ))}

      {localize(active && (
        <button className="robot-widget" type="button" onClick={openDetails} aria-label={localize("Open the exploration details")}>
          <RobotPortrait size={64} />
          <span>
            <strong>{localize("Exploring Mars")}</strong>
            <small>{localize("Back on Day ")}{localize(active.returnDay)} · {localize(formatDays(Math.max(0, active.returnDay - day)))}{localize(" left")}</small>
          </span>
          <b>{localize(unlockedIds.length)}/10</b>
        </button>
      ))}

      {localize(menuOpen && (
        <div className="exploration-layer" role="dialog" aria-modal="true" aria-labelledby="exploration-title">
          <section className="exploration-menu" data-voice-options>
            <header>
              <div><span className="exploration-eyebrow">{localize("Robot AUR-1")}</span><h2 id="exploration-title">{localize("Exploration missions")}</h2></div>
              <button className="exploration-close" type="button" onClick={closeMenu} aria-label={localize("Close")} autoFocus>×</button>
            </header>
            <div className="exploration-balance">{localize("Water ")}{localize(Math.round(water))}{localize(" · Energy ")}{localize(Math.round(energy))}{localize(" · Minerals ")}{localize(minerals)}{localize(" · Reports ")}{localize(unlockedIds.length)}/10</div>
            <div className="exploration-options">
              {localize(options.map((mission) => {
                const affordable = water >= mission.cost.water && energy >= mission.cost.energy;
                const returnsInTime = day + missionDays(mission) <= missionLastDay();
                return (
                  <article className={`exploration-option exploration-option--${mission.risk}`} key={mission.id}>
                    <span className="exploration-number">{localize("OPTION ")}{localize(mission.optionNumber)}</span>
                    <MissionDetails mission={mission} />
                    <button type="button" disabled={!affordable || !returnsInTime} onClick={() => launch(mission)}>
                      {localize(!returnsInTime ? 'Would come back too late' : affordable ? 'Send the robot' : 'Not enough water or energy')}
                    </button>
                  </article>
                );
              }))}
            </div>
          </section>
        </div>
      ))}

      {localize(detailsOpen && active && (
        <div className="exploration-layer" role="dialog" aria-modal="true" aria-labelledby="active-title">
          <section className="exploration-summary" data-voice-story>
            <RobotPortrait size={96} />
            <div><span className="exploration-eyebrow">{localize("MISSION IN PROGRESS")}</span><h2 id="active-title">{localize(active.mission.title)}</h2></div>
            <MissionDetails mission={active.mission} />
            <p className="exploration-countdown">{localize("Back on Day ")}{localize(active.returnDay)}: {localize(formatDays(Math.max(0, active.returnDay - day)))}{localize(" left")}</p>
            <button type="button" onClick={closeDetails} autoFocus>{localize("Back to the game")}</button>
          </section>
        </div>
      ))}

      {localize(lastOutcome && !celebrationPending && (
        <div className="exploration-layer" role="dialog" aria-modal="true" aria-labelledby="reward-title">
          <section className={`exploration-reward ${lastOutcome.succeeded ? 'is-success' : 'is-failure'}`} data-voice-story>
            <span className="exploration-eyebrow">{localize("THE ROBOT IS BACK")}</span>
            <h2 id="reward-title">{localize(lastOutcome.succeeded ? 'Exploration done!' : 'No samples this time')}</h2>
            {localize(lastOutcome.report ? (
              <div className="report-card">
                <span>{localize("NEW REPORT · ")}{localize(unlockedIds.length)}/10</span>
                <h3>{localize(lastOutcome.report.title)}</h3>
                <p>{localize(lastOutcome.report.narrative)}</p>
              </div>
            ) : (
              <p>{localize("The ground was too rough to collect anything. The robot kept its data, and the next mission will be easier.")}</p>
            ))}
            {localize(lastOutcome.succeeded && <p className="exploration-gains">+{localize(lastOutcome.mission.reward.minerals)}{localize(" minerals · +")}{localize(lastOutcome.mission.reward.water)}{localize(" water · +")}{localize(lastOutcome.mission.reward.energy)}{localize(" energy")}</p>)}
            {localize(lastOutcome.wasGuaranteed && <small>{localize("This one was sure to work, after the bad luck before.")}</small>)}
            <button type="button" onClick={closeOutcome} autoFocus>{localize("Continue")}</button>
          </section>
        </div>
      ))}

      {localize(celebrationPending && (
        <div className="exploration-layer medal-layer" role="dialog" aria-modal="true" aria-labelledby="medal-title">
          <section className="medal-celebration" data-voice-story>
            <div className="medal-rays" />
            <div className="medal-icon" aria-hidden="true">★</div>
            <span className="exploration-eyebrow">{localize("COLLECTION COMPLETE · ")}{localize(unlockedReports.length)}/10</span>
            <h2 id="medal-title">{localize("Explorer Medal")}</h2>
            <p>{localize("You collected all ten Mars reports. The crew now has a complete science map of the area!")}</p>
            <button type="button" onClick={receiveMedal} autoFocus>{localize("Get the medal")}</button>
          </section>
        </div>
      ))}
    </>
  );
}
