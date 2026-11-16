import { useResourceStore } from '../../stores/useResourceStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { PROTOCOLS } from '../../data/difficulty';
import { daysLeft } from '../../engine/survival';
import { HudBar, isDanger } from './HudBar';
import { EnergyIcon, FoodIcon, OxygenIcon, RadiationIcon, WarningIcon, WaterIcon } from './HudIcons';

/** "About 3 days left!" for a vital bar that is falling (game over at 0). */
function left(n: number | null): string {
  if (n === null) return '';
  return n <= 1 ? ' Less than 1 day left!' : ` About ${n} days left!`;
}

/**
 * Top-left HUD: the station's resources (shared by everyone, not one person).
 * Radiation is the level inside the station: a full bar is bad, so it warns when HIGH.
 * A danger bar turns red, blinks AND gets a written alert line (never color only).
 * Oxygen at 0 (or radiation at 100) is game over, so that warning says how long is left.
 * Health has no bar (it stays in the background, see SHOWN_RESOURCES), only this written warning.
 */
export function PlayerStatus() {
  const food = useResourceStore((s) => s.food);
  const water = useResourceStore((s) => s.water);
  const oxygen = useResourceStore((s) => s.oxygen);
  const radiation = useResourceStore((s) => s.radiation);
  const energy = useResourceStore((s) => s.energy);
  const health = useResourceStore((s) => s.health);
  const protocols = useMissionStore((s) => s.protocols);

  const alerts = [
    energy <= 0 ? 'BLACKOUT: no energy, oxygen and water drop fast!' : isDanger(energy) && 'Energy is low!',
    isDanger(oxygen) && `Oxygen is low!${left(daysLeft('oxygen'))}`,
    isDanger(health) && 'The crew is weak: someone may get sick!',
    water <= 0 ? 'No water!' : isDanger(water) && 'Water is low!',
    food <= 0 ? 'No food!' : isDanger(food) && 'Food is low!',
    isDanger(radiation, true) && 'Radiation is too high!',
  ].filter((a): a is string => Boolean(a));
  const onNow = PROTOCOLS.filter((p) => protocols.includes(p.id));

  return (
    <section className="hud-panel hud-status" aria-label="Station" data-read>
      <h2 className="hud-group__label">Station</h2>
      <HudBar icon={<FoodIcon />} label="Food" value={food} color="var(--hud-orange)" />
      <HudBar icon={<WaterIcon />} label="Water" value={water} color="var(--hud-blue)" />
      <HudBar icon={<OxygenIcon />} label="Oxygen" value={oxygen} color="var(--hud-green)" />
      <HudBar icon={<RadiationIcon />} label="Radiation" value={radiation} color="var(--hud-yellow)" higherIsWorse />
      <HudBar icon={<EnergyIcon />} label="Energy" value={energy} color="var(--hud-purple)" />
      {alerts.length > 0 && (
        <p className="hud-alert" role="status">
          <WarningIcon size={20} />
          {alerts.join(' ')}
        </p>
      )}
      {onNow.map((p) => (
        <p key={p.id} className="hud-protocol">
          {p.short}
        </p>
      ))}
    </section>
  );
}
