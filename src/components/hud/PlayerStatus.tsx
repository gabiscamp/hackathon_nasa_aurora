import { useResourceStore } from '../../stores/useResourceStore';
import { HudBar, isDanger } from './HudBar';
import { EnergyIcon, FoodIcon, OxygenIcon, RadiationIcon, WarningIcon, WaterIcon } from './HudIcons';

/**
 * Top-left HUD: the station's resources (shared by everyone, not one person).
 * Radiation is the level inside the station: a full bar is bad, so it warns when HIGH.
 * A danger bar turns red, blinks AND gets a written alert line (never color only).
 */
export function PlayerStatus() {
  const food = useResourceStore((s) => s.food);
  const water = useResourceStore((s) => s.water);
  const oxygen = useResourceStore((s) => s.oxygen);
  const radiation = useResourceStore((s) => s.radiation);
  const energy = useResourceStore((s) => s.energy);

  const alerts = [
    isDanger(food) && 'Food is low!',
    isDanger(water) && 'Water is low!',
    isDanger(oxygen) && 'Oxygen is low!',
    isDanger(radiation, true) && 'Radiation is too high!',
    isDanger(energy) && 'Energy is low!',
  ].filter((a): a is string => Boolean(a));

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
    </section>
  );
}
