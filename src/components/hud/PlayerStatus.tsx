import { useResourceStore } from '../../stores/useResourceStore';
import { HudBar } from './HudBar';
import { EnergyIcon, FoodIcon, OxygenIcon, RadiationIcon, WaterIcon } from './HudIcons';

/**
 * Top-left HUD: the station's resources (shared by everyone, not one person).
 * Radiation is the level inside the station: a full bar is bad, so it warns when HIGH.
 */
export function PlayerStatus() {
  const food = useResourceStore((s) => s.food);
  const water = useResourceStore((s) => s.water);
  const oxygen = useResourceStore((s) => s.oxygen);
  const radiation = useResourceStore((s) => s.radiation);
  const energy = useResourceStore((s) => s.energy);

  return (
    <section className="hud-panel hud-status" aria-label="Station">
      <h2 className="hud-group__label">Station</h2>
      <HudBar icon={<FoodIcon />} label="Food" value={food} color="var(--hud-orange)" />
      <HudBar icon={<WaterIcon />} label="Water" value={water} color="var(--hud-blue)" />
      <HudBar icon={<OxygenIcon />} label="Oxygen" value={oxygen} color="var(--hud-green)" />
      <HudBar icon={<RadiationIcon />} label="Radiation" value={radiation} color="var(--hud-yellow)" higherIsWorse />
      <HudBar icon={<EnergyIcon />} label="Energy" value={energy} color="var(--hud-purple)" />
    </section>
  );
}
