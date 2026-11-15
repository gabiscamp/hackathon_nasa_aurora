/**
 * Ship layout used by the game and the HUD.
 *
 * The station is the ISS-style assembly in `stationLayout.ts`, built from the
 * team's module art in src/assets/Nave/ (see scripts/build_station_assets.py).
 * This module keeps the API the rest of the game imports (rooms, floor,
 * spawns, mission spots) in one place.
 */
import {
  WALKABLE_AREAS,
  isPointWalkable,
  type RoomId,
} from './stationLayout';

export {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  WALKABLE_AREAS,
  BLOCKED_AREAS,
  PLACEMENTS,
  PIECES,
  STATION_SCALE,
  PLAYER_SPAWN,
  NPC_SPAWNS,
  placedCenter,
  pieceScale,
  isPointWalkable,
  isBoxWalkable,
  roomAt,
} from './stationLayout';
export type { RoomId, Rect, WalkableArea, Placement, PieceKey } from './stationLayout';

/** Mars orbit backdrop seen behind the station (fixed to the screen, not to the map). ENV-002 */
export const SPACE_BG_KEY = 'mars-backdrop';
export const SPACE_BG_URL = '/assets/environments/mars-backdrop.jpg';

/**
 * Mission marker spot per room: the middle of the room's biggest floor area whose
 * middle is free of furniture, so it always sits on walkable floor.
 */
export const ROOM_CENTERS = (() => {
  const best = {} as Record<RoomId, { x: number; y: number; area: number }>;
  for (const a of WALKABLE_AREAS) {
    const x = a.x + a.w / 2;
    const y = a.y + a.h / 2;
    if (!isPointWalkable(x, y)) continue;
    const area = a.w * a.h;
    if (!best[a.room] || area > best[a.room].area) best[a.room] = { x, y, area };
  }
  const centers = {} as Record<RoomId, { x: number; y: number }>;
  for (const room of Object.keys(best) as RoomId[]) centers[room] = { x: best[room].x, y: best[room].y };
  return centers;
})();
