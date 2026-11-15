import { useEffect, useState } from 'react';
import { gameEvents, EVENTS, type PlayerMovedPayload } from '../../game/events';
import { WALKABLE_AREAS, NPC_SPAWNS, PLAYER_SPAWN } from '../../game/world/shipLayout';
import { useCrewStore } from '../../stores/useCrewStore';
import { CREW_ROLES } from '../../data/crew';

/** Square region of the world (ship bounds) shown inside the round minimap. */
const VIEW = { x: 230, y: -225, size: 1240 } as const;

/** Bottom-right HUD: round radar with room floors, crew dots and the player. */
export function Minimap() {
  const [pos, setPos] = useState<PlayerMovedPayload>(PLAYER_SPAWN);
  const crew = useCrewStore((s) => s.crew);

  useEffect(() => {
    const onMove = (p: PlayerMovedPayload) => setPos({ x: p.x, y: p.y });
    gameEvents.on(EVENTS.PLAYER_MOVED, onMove);
    return () => {
      gameEvents.off(EVENTS.PLAYER_MOVED, onMove);
    };
  }, []);

  return (
    <div className="hud-minimap" aria-label="Minimap">
      <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.size} ${VIEW.size}`} className="hud-minimap__map">
        {/* radar grid */}
        <g stroke="rgba(77, 201, 246, 0.14)" strokeWidth="5">
          {[1, 2, 3].map((i) => (
            <line key={`v${i}`} x1={VIEW.x + (VIEW.size / 4) * i} y1={VIEW.y} x2={VIEW.x + (VIEW.size / 4) * i} y2={VIEW.y + VIEW.size} />
          ))}
          {[1, 2, 3].map((i) => (
            <line key={`h${i}`} x1={VIEW.x} y1={VIEW.y + (VIEW.size / 4) * i} x2={VIEW.x + VIEW.size} y2={VIEW.y + (VIEW.size / 4) * i} />
          ))}
        </g>
        {/* floors */}
        <g fill="rgba(154, 143, 130, 0.55)">
          {WALKABLE_AREAS.map((a, i) => (
            <rect key={i} x={a.x} y={a.y} width={a.w} height={a.h} />
          ))}
        </g>
        {/* crew */}
        {CREW_ROLES.map((role) => (
          <circle key={role} cx={NPC_SPAWNS[role].x} cy={NPC_SPAWNS[role].y - 14} r="28" fill={crew[role].color} stroke="#0a0e27" strokeWidth="8" />
        ))}
        {/* player */}
        <circle cx={pos.x} cy={pos.y - 14} r="60" fill="rgba(245, 166, 35, 0.3)" className="hud-minimap__ping" />
        <circle cx={pos.x} cy={pos.y - 14} r="36" fill="#f5a623" stroke="#0a0e27" strokeWidth="9" />
      </svg>
      <span className="hud-minimap__north">N</span>
    </div>
  );
}
