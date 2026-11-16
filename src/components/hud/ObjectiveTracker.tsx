import { t as localize } from '../../i18n/translate';
import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { getAct } from '../panels/DayTracker';
import { gameEvents, EVENTS } from '../../game/events';
import { ROOM_NAMES } from './LocationHint';
import { useMissionTargets } from './useMissionTarget';

import { MISSION_DAYS } from '../../data/missionLength';

/** Top-right HUD: what to do now (same words as the banner), plus how far the mission has gone. */
export function ObjectiveTracker() {
  const day = useGameStore((s) => s.day);
  const phase = useGameStore((s) => s.phase);
  const mission = useMissionStore((s) => s.currentMission);
  const targets = useMissionTargets();
  const { label: actLabel } = getAct(day);

  // Once the player reaches the "!" and the mission window opens, the task becomes "choose".
  const [atMission, setAtMission] = useState(false);
  useEffect(() => {
    const onStart = () => setAtMission(true);
    gameEvents.on(EVENTS.MISSION_START, onStart);
    return () => void gameEvents.off(EVENTS.MISSION_START, onStart);
  }, []);
  useEffect(() => {
    if (phase !== 'decision') setAtMission(false);
  }, [phase]);

  const title =
    mission && phase !== 'summary' ? mission.title : targets.length === 1 ? targets[0].title : targets.length > 1 ? 'Several problems!' : actLabel;
  const objective =
    phase === 'decision'
      ? mission && atMission
        ? 'Choose what the crew should do'
        : targets.length === 1
          ? `Go to ${ROOM_NAMES[targets[0].room]} and press E`
          : targets.length > 1
            ? `${targets.length} problems: walk to each ! and press E`
            : 'Explore the ship'
      : phase === 'result'
        ? 'Listen to Mission Control'
        : phase === 'summary'
          ? 'Review the day'
          : 'Explore the ship';
  const touchObjective =
    phase === 'decision' && !(mission && atMission)
      ? targets.length === 1
        ? `Go to ${ROOM_NAMES[targets[0].room]} and tap USE`
        : targets.length > 1
          ? `${targets.length} problems: walk to each ! and tap USE`
          : objective
      : objective;
  const pct = Math.min(100, (day / MISSION_DAYS) * 100);

  return (
    <section className="hud-panel hud-objective" aria-label={localize("Mission")} data-read>
      <div className="hud-objective__top">
        <p className="hud-objective__title">{localize(title)}</p>
        <span className="hud-objective__day">{localize(" Day ")}{localize(day)}/{localize(MISSION_DAYS)}
        </span>
      </div>
      <p className="hud-objective__task">
        <span className="game-hint-desktop">{localize(objective)}</span>
        <span className="game-hint-touch">{localize(touchObjective)}</span>
      </p>
      <span
        className="hud-objective__track"
        role="meter"
        aria-label={localize("Mission day")}
        aria-valuenow={day}
        aria-valuemin={1}
        aria-valuemax={MISSION_DAYS}
      >
        <span style={{ width: `${pct}%` }} />
      </span>
    </section>
  );
}
