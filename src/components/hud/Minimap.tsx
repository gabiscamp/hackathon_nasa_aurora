import { WALKABLE_AREAS, NPC_SPAWNS } from '../../game/world/shipLayout';
import { useCrewStore } from '../../stores/useCrewStore';
import { CREW_ROLES } from '../../data/crew';
import { usePlayerPosition } from './usePlayerPosition';
<<<<<<< HEAD
import { useRobotPosition } from './useRobotPosition';
import { useExplorationStore } from '../../stores/useExplorationStore';

const ROBOT_COLOR = '#9a5b32';
=======
import { useMissionTarget } from './useMissionTarget';
>>>>>>> origin/main

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
  const robotPos = useRobotPosition();
  const crew = useCrewStore((s) => s.crew);
<<<<<<< HEAD
  const robotAboard = useExplorationStore((s) => s.status === 'aboard');
=======
  const target = useMissionTarget();
>>>>>>> origin/main

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
<<<<<<< HEAD
        {/* AUR-1 uses the rover's brown body colour and disappears while exploring Mars. */}
        {robotAboard && (
          <circle cx={robotPos.x} cy={robotPos.y - 14} r="24" fill={ROBOT_COLOR} stroke="#0a0e27" strokeWidth="7" />
=======
        {/* mission spot: same "!" as in the ship */}
        {target && (
          <g className="hud-minimap__mission">
            <circle cx={target.x} cy={target.y} r="60" fill="rgba(231, 76, 60, 0.35)" className="hud-minimap__ping" />
            <circle cx={target.x} cy={target.y} r="38" fill="#e74c3c" stroke="#0a0e27" strokeWidth="8" />
            <text x={target.x} y={target.y + 18} textAnchor="middle" fontSize="54" fontWeight="800" fill="#f0ece4">!</text>
          </g>
>>>>>>> origin/main
        )}
        {/* player */}
        <circle cx={pos.x} cy={pos.y - 14} r="48" fill="rgba(245, 166, 35, 0.35)" className="hud-minimap__ping" />
        <circle cx={pos.x} cy={pos.y - 14} r="28" fill="#f5a623" stroke="#0a0e27" strokeWidth="8" />
      </svg>
      <kbd className="hud-minimap__key">M</kbd>
    </button>
  );
}
