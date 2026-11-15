/**
 * Ship layout built on top of the team's station illustration
 * `public/assets/environments/station-map.png` (1600×800, magenta key removed;
 * original in assets/environments/_source/).
 *
 * All coordinates are image pixels, measured by hand over a 20 px grid.
 * The floor is a union of rectangles that avoids furniture; the player's feet
 * box must stay fully inside it. Order matters for `roomAt`: the first match wins,
 * so small rooms come before the big central corridor.
 */
export const SHIP_BG_KEY = 'station-map';
export const SHIP_BG_URL = '/assets/environments/station-map.png';
/** Mars orbit backdrop seen behind the station (fixed to the screen, not to the map). ENV-002 */
export const SPACE_BG_KEY = 'mars-backdrop';
export const SPACE_BG_URL = '/assets/environments/mars-backdrop.jpg';

export const WORLD_WIDTH = 1600;
export const WORLD_HEIGHT = 800;

export type RoomId =
  | 'bridge'
  | 'quarters'
  | 'lab'
  | 'common'
  | 'engineering'
  | 'storage'
  | 'airlock'
  | 'gym'
  | 'corridor';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WalkableArea extends Rect {
  room: RoomId;
}

export const WALKABLE_AREAS: readonly WalkableArea[] = [
  // Crew quarters (top-left): aisle between the four bunks, door to the corridor
  { room: 'quarters', x: 455, y: 128, w: 75, h: 209 },
  { room: 'quarters', x: 402, y: 178, w: 180, h: 35 },

  // Lab + greenhouse (top-centre): open bottom, aisles beside the robot arm
  { room: 'lab', x: 752, y: 245, w: 96, h: 60 },
  { room: 'lab', x: 745, y: 205, w: 105, h: 50 },
  { room: 'lab', x: 740, y: 126, w: 30, h: 86 },
  { room: 'lab', x: 770, y: 126, w: 62, h: 12 },

  // Kitchen / common room (top-right): around the dining table
  { room: 'common', x: 1024, y: 262, w: 74, h: 75 },
  { room: 'common', x: 1000, y: 185, w: 62, h: 92 },
  { room: 'common', x: 1000, y: 185, w: 240, h: 20 },
  { room: 'common', x: 1185, y: 185, w: 55, h: 92 },
  { room: 'common', x: 1000, y: 262, w: 240, h: 15 },

  // Bridge (right): capsule behind the cockpit door
  { room: 'bridge', x: 1385, y: 292, w: 62, h: 185 },
  { room: 'bridge', x: 1330, y: 345, w: 60, h: 85 },

  // Engineering + life support (left): reactor door and the strip around the tanks
  { room: 'engineering', x: 245, y: 355, w: 40, h: 70 },
  { room: 'engineering', x: 282, y: 332, w: 32, h: 110 },
  { room: 'engineering', x: 282, y: 332, w: 178, h: 16 },
  { room: 'engineering', x: 282, y: 434, w: 178, h: 13 },

  // Storage (bottom-left): door, front aisle and the aisle between racks and consoles
  { room: 'storage', x: 470, y: 445, w: 38, h: 60 },
  { room: 'storage', x: 470, y: 480, w: 110, h: 22 },
  { room: 'storage', x: 547, y: 480, w: 30, h: 122 },

  // EVA / airlock (bottom-centre): between the suit lockers, down to the docking hatch
  { room: 'airlock', x: 750, y: 445, w: 95, h: 210 },

  // Gym & hygiene (bottom-right): door, aisle by the shower, back strip
  { room: 'gym', x: 1072, y: 440, w: 31, h: 70 },
  { room: 'gym', x: 1076, y: 495, w: 24, h: 110 },
  { room: 'gym', x: 975, y: 595, w: 290, h: 22 },

  // Central corridor and its side pockets (last: it is the fallback room)
  { room: 'corridor', x: 445, y: 335, w: 895, h: 100 },
  { room: 'corridor', x: 370, y: 430, w: 880, h: 15 },
  { room: 'corridor', x: 580, y: 295, w: 60, h: 45 },
  { room: 'corridor', x: 640, y: 300, w: 310, h: 40 },
];

export const PLAYER_SPAWN = { x: 680, y: 400 } as const;

/** Where each crew role works; keys match CrewRole in src/data/crew.ts. */
export const NPC_SPAWNS = {
  engineer: { x: 298, y: 400, room: 'engineering' },
  medic: { x: 1180, y: 608, room: 'gym' },
  scientist: { x: 797, y: 235, room: 'lab' },
} as const satisfies Record<string, { x: number; y: number; room: RoomId }>;

export function isPointWalkable(x: number, y: number): boolean {
  return WALKABLE_AREAS.some((a) => x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h);
}

/** True when every corner of the box lies on a walkable area. */
export function isBoxWalkable(cx: number, cy: number, halfW: number, halfH: number): boolean {
  return (
    isPointWalkable(cx - halfW, cy - halfH) &&
    isPointWalkable(cx + halfW, cy - halfH) &&
    isPointWalkable(cx - halfW, cy + halfH) &&
    isPointWalkable(cx + halfW, cy + halfH)
  );
}

export function roomAt(x: number, y: number): RoomId | null {
  const area = WALKABLE_AREAS.find((a) => x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h);
  return area ? area.room : null;
}
