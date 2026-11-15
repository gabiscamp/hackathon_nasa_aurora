import { useGameStore } from '../../stores/useGameStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { getAct } from '../panels/DayTracker';

const MISSION_DAYS = 90;

/** Top-right HUD: what to do now, plus how far the 90-day mission has gone. */
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
  const pct = Math.min(100, (day / MISSION_DAYS) * 100);

  return (
    <section className="hud-panel hud-objective" aria-label="Mission">
      <div className="hud-objective__top">
        <p className="hud-objective__title">{title}</p>
        <span className="hud-objective__day">
          Day {day}/{MISSION_DAYS}
        </span>
      </div>
      <p className="hud-objective__task">{objective}</p>
      <span
        className="hud-objective__track"
        role="meter"
        aria-label="Mission day"
        aria-valuenow={day}
        aria-valuemin={1}
        aria-valuemax={MISSION_DAYS}
      >
        <span style={{ width: `${pct}%` }} />
      </span>
    </section>
  );
}
