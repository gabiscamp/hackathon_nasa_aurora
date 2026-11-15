import { useResourceStore } from '../../stores/useResourceStore';
import { HudBar } from './HudBar';
import { EnergyIcon, FoodIcon, HeartIcon, OxygenIcon, RadiationIcon, SmileIcon, WaterIcon } from './HudIcons';

/**
 * Top-left HUD: the 7 mission resources (mission system from main, PR #6), in two groups.
 * Station: food, water, oxygen, radiation, energy. Crew: health and satisfaction.
 * Radiation starts at 0 and a full bar is bad, so it warns when HIGH.
 */
export function PlayerStatus() {
  const food = useResourceStore((s) => s.food);
  const water = useResourceStore((s) => s.water);
  const oxygen = useResourceStore((s) => s.oxygen);
  const radiation = useResourceStore((s) => s.radiation);
  const energy = useResourceStore((s) => s.energy);
  const health = useResourceStore((s) => s.health);
  const satisfaction = useResourceStore((s) => s.satisfaction);

  return (
    <div className="hud-panel hud-status">
      <section className="hud-group" aria-label="Station">
        <h2 className="hud-group__label">Station</h2>
        <HudBar icon={<FoodIcon />} label="Food" value={food} color="var(--hud-orange)" />
        <HudBar icon={<WaterIcon />} label="Water" value={water} color="var(--hud-blue)" />
        <HudBar icon={<OxygenIcon />} label="Oxygen" value={oxygen} color="var(--hud-green)" />
        <HudBar icon={<RadiationIcon />} label="Radiation" value={radiation} color="var(--hud-yellow)" higherIsWorse />
        <HudBar icon={<EnergyIcon />} label="Energy" value={energy} color="var(--hud-purple)" />
      </section>
      <section className="hud-group" aria-label="Crew">
        <h2 className="hud-group__label">Crew</h2>
        <HudBar icon={<HeartIcon />} label="Health" value={health} color="var(--hud-red-soft)" />
        <HudBar icon={<SmileIcon />} label="Satisfaction" value={satisfaction} color="var(--hud-amber)" />
      </section>
    </div>
  );
}
