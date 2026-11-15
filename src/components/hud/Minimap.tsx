import { WALKABLE_AREAS, NPC_SPAWNS } from '../../game/world/shipLayout';
import { useCrewStore } from '../../stores/useCrewStore';
import { CREW_ROLES } from '../../data/crew';
import { usePlayerPosition } from './usePlayerPosition';

const PAD = 30;
/** World region shown: the walkable floor's bounding box plus a margin (ship is about 2:1 wide). */
const VIEW = (() => {
  const x = Math.min(...WALKABLE_AREAS.map((a) => a.x)) - PAD;
  const y = Math.min(...WALKABLE_AREAS.map((a) => a.y)) - PAD;
  const w = Math.max(...WALKABLE_AREAS.map((a) => a.x + a.w)) + PAD - x;
  const h = Math.max(...WALKABLE_AREAS.map((a) => a.y + a.h)) + PAD - y;
  return { x, y, w, h };
})();

/** Bottom-right HUD: ship-shaped map with room floors, crew dots and the player ("You"). */
export function Minimap({ onOpen }: { onOpen: () => void }) {
  const pos = usePlayerPosition();
  const crew = useCrewStore((s) => s.crew);

  return (
    <button type="button" className="hud-panel hud-minimap" onClick={onOpen} aria-label="Open the full ship map (M)" title="Open the full ship map (M)">
      <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className="hud-minimap__map" aria-hidden="true">
        {/* floors */}
        <g fill="#b9c3d6">
          {WALKABLE_AREAS.map((a, i) => (
            <rect key={i} x={a.x} y={a.y} width={a.w} height={a.h} />
          ))}
        </g>
        {/* crew */}
        {CREW_ROLES.map((role) => (
          <circle key={role} cx={NPC_SPAWNS[role].x} cy={NPC_SPAWNS[role].y - 14} r="22" fill={crew[role].color} stroke="#0a0e27" strokeWidth="7" />
        ))}
        {/* player */}
        <circle cx={pos.x} cy={pos.y - 14} r="48" fill="rgba(245, 166, 35, 0.35)" className="hud-minimap__ping" />
        <circle cx={pos.x} cy={pos.y - 14} r="28" fill="#f5a623" stroke="#0a0e27" strokeWidth="8" />
      </svg>
      <kbd className="hud-minimap__key">M</kbd>
    </button>
  );
}
