import { useGameStore } from '../../stores/useGameStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { getAct } from '../panels/DayTracker';
import { AlertIcon } from './HudIcons';

const MISSION_DAYS = 90;

/** Top-right HUD: current objective + mission day progress. */
export function ObjectiveTracker() {
  const day = useGameStore((s) => s.day);
  const phase = useGameStore((s) => s.phase);
  const mission = useMissionStore((s) => s.currentMission);
  const { label: actLabel } = getAct(day);

  const title = mission && phase !== 'summary' ? mission.title : actLabel;
  const objective =
    phase === 'decision'
      ? 'Choose what the crew should do'
      : phase === 'result'
        ? 'Listen to Mission Control'
        : phase === 'summary'
          ? 'Review the day'
          : 'Explore the ship';

  return (
    <div className="hud-objective">
      <span className="hud-objective__icon">
        <AlertIcon size={18} />
      </span>
      <div className="hud-objective__body">
        <div className="hud-objective__title">{title}</div>
        <div className="hud-objective__task">
          <span className="hud-diamond" aria-hidden="true" />
          {objective}
        </div>
        <div className="hud-objective__days">
          <span className="hud-objective__days-track">
            <span style={{ width: `${(day / MISSION_DAYS) * 100}%` }} />
          </span>
          <span className="hud-objective__days-label">
            Day {day}/{MISSION_DAYS}
          </span>
        </div>
      </div>
    </div>
  );
}
