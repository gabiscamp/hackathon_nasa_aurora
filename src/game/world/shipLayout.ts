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
  type WalkableArea,
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
  isPointWalkable,
  isBoxWalkable,
  roomAt,
} from './stationLayout';
export type { RoomId, Rect, WalkableArea, Placement, PieceKey } from './stationLayout';

/** Mars orbit backdrop seen behind the station (fixed to the screen, not to the map). ENV-002 */
export const SPACE_BG_KEY = 'mars-backdrop';
export const SPACE_BG_URL = '/assets/environments/mars-backdrop.jpg';

/** Clear floor needed around a marker spot, so the player can stand next to the "!". */
const MARKER_CLEARANCE = 14;

/** Is there free floor in a small cross around (x, y)? */
function isRoomy(x: number, y: number): boolean {
  const d = MARKER_CLEARANCE;
  return [
    [0, 0],
    [d, 0],
    [-d, 0],
    [0, d],
    [0, -d],
  ].every(([dx, dy]) => isPointWalkable(x + dx, y + dy));
}

/**
 * Mission marker spot per room: inside the room's biggest floor area, the free spot
 * (not on furniture) closest to its middle. Rooms with a big table or a toilet in the
 * middle (Kitchen, Bathroom) get a spot beside it instead of the doorway.
 */
export const ROOM_CENTERS = (() => {
  const biggest = {} as Record<RoomId, WalkableArea>;
  for (const a of WALKABLE_AREAS) {
    if (!biggest[a.room] || a.w * a.h > biggest[a.room].w * biggest[a.room].h) biggest[a.room] = a;
  }
  const centers = {} as Record<RoomId, { x: number; y: number }>;
  for (const room of Object.keys(biggest) as RoomId[]) {
    const a = biggest[room];
    const mid = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
    const STEP = 6;
    let found: { x: number; y: number } | null = null;
    let bestDist = Infinity;
    for (let y = a.y + STEP; y < a.y + a.h; y += STEP) {
      for (let x = a.x + STEP; x < a.x + a.w; x += STEP) {
        const dist = Math.hypot(x - mid.x, y - mid.y);
        if (dist < bestDist && isRoomy(x, y)) {
          bestDist = dist;
          found = { x, y };
        }
      }
    }
    // Fallback: any walkable middle of the room's floor areas (thin corridors).
    if (!found) {
      const any = WALKABLE_AREAS.find((w) => w.room === room && isPointWalkable(w.x + w.w / 2, w.y + w.h / 2));
      if (any) found = { x: any.x + any.w / 2, y: any.y + any.h / 2 };
    }
    if (found) centers[room] = found;
  }
  return centers;
})();
