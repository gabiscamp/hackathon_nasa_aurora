/**
 * Ship layout built on top of the reference illustration
 * `references/spaceship-reference-02.jpeg` (1600×900).
 *
 * TODO: replace with real asset — the reference image is a temporary base
 * for the map until the tileset/tilemap (MAP-001, TIL-001 in
 * assets/ASSET_CATALOG.md) is produced. All coordinates below are in
 * reference-image pixels, measured by hand from that image.
 */
import shipReferenceUrl from '../../../references/spaceship-reference-02.jpeg';

export const SHIP_BG_KEY = 'ship-reference-bg';
export const SHIP_BG_URL: string = shipReferenceUrl;

export const WORLD_WIDTH = 1600;
export const WORLD_HEIGHT = 900;

/** Matches the plain space color of the reference, used to hide its baked-in HUD. */
export const SPACE_MASK_COLOR = 0x11152a;

export type RoomId =
  | 'bridge'
  | 'quarters'
  | 'lab'
  | 'storage'
  | 'medical'
  | 'common'
  | 'engineering'
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

export interface CircleMask {
  x: number;
  y: number;
  r: number;
}

/**
 * Floor regions the player may stand on. The player's feet box must be
 * fully covered by the union of these rectangles.
 * Some door openings are gameplay openings not drawn in the art
 * (quarters ↔ bridge, hub ↔ medical, hub ↔ common, common ↔ right corridor).
 */
export const WALKABLE_AREAS: readonly WalkableArea[] = [
  // Bridge
  { room: 'bridge', x: 640, y: 248, w: 315, h: 104 },
  { room: 'bridge', x: 640, y: 222, w: 60, h: 30 },
  // Central hub + left corridor
  { room: 'corridor', x: 735, y: 340, w: 107, h: 220 },
  { room: 'corridor', x: 402, y: 405, w: 440, h: 87 },
  // Crew quarters (door on its right wall)
  { room: 'quarters', x: 585, y: 295, w: 60, h: 50 },
  { room: 'quarters', x: 480, y: 260, w: 110, h: 85 },
  { room: 'quarters', x: 372, y: 245, w: 110, h: 30 },
  // Storage (door through the dark panels under the corridor)
  { room: 'storage', x: 600, y: 485, w: 100, h: 55 },
  { room: 'storage', x: 495, y: 535, w: 190, h: 97 },
  { room: 'storage', x: 580, y: 530, w: 105, h: 135 },
  { room: 'storage', x: 495, y: 625, w: 45, h: 40 },
  // Medical bay (entered from the hub)
  { room: 'medical', x: 735, y: 555, w: 70, h: 30 },
  { room: 'medical', x: 705, y: 578, w: 100, h: 50 },
  { room: 'medical', x: 790, y: 618, w: 65, h: 97 },
  { room: 'medical', x: 855, y: 648, w: 43, h: 67 },
  // Common room
  { room: 'common', x: 842, y: 415, w: 33, h: 80 },
  { room: 'common', x: 872, y: 443, w: 298, h: 27 },
  { room: 'common', x: 872, y: 443, w: 88, h: 110 },
  { room: 'common', x: 1082, y: 465, w: 53, h: 90 },
  // Right corridor (links common room, lab and the lower-right room)
  { room: 'corridor', x: 1160, y: 465, w: 45, h: 40 },
  { room: 'corridor', x: 1203, y: 340, w: 42, h: 245 },
  // Lab
  { room: 'lab', x: 975, y: 287, w: 250, h: 30 },
  { room: 'lab', x: 975, y: 287, w: 55, h: 63 },
  { room: 'lab', x: 1100, y: 287, w: 35, h: 63 },
  { room: 'lab', x: 1170, y: 300, w: 75, h: 52 },
  // Lower-right room
  { room: 'engineering', x: 975, y: 578, w: 275, h: 77 },
];

/** Areas of the reference image that contain its painted HUD (to be hidden). */
export const HUD_RECT_MASKS: readonly Rect[] = [
  { x: 0, y: 0, w: 372, h: 132 }, // portrait + bars
  { x: 0, y: 132, w: 160, h: 32 }, // level badge
  { x: 1275, y: 15, w: 325, h: 102 }, // mission panel
  { x: 585, y: 797, w: 425, h: 103 }, // inventory bar
  { x: 8, y: 812, w: 180, h: 66 }, // "Tab Inventário"
];
export const HUD_CIRCLE_MASKS: readonly CircleMask[] = [{ x: 1502, y: 768, r: 92 }]; // minimap

/**
 * The reference has a character painted in the hub (x 770–815, y 402–478).
 * Each patch covers part of it with floor copied from (x+dx, y+dy).
 * Hub floor seams are at y=354/462/500/512 and x=752/824, so sources stay
 * inside the same floor plate, and the y=462 seam is copied sideways.
 */
export interface ImagePatch extends Rect {
  dx: number;
  dy: number;
}
export const BAKED_CHARACTER_PATCHES: readonly ImagePatch[] = [
  { x: 765, y: 398, w: 56, h: 32, dx: 0, dy: -42 },
  { x: 765, y: 430, w: 56, h: 30, dx: 0, dy: -74 },
  { x: 765, y: 460, w: 14, h: 6, dx: -10, dy: 0 },
  { x: 779, y: 460, w: 14, h: 6, dx: -24, dy: 0 },
  { x: 793, y: 460, w: 14, h: 6, dx: -38, dy: 0 },
  { x: 807, y: 460, w: 14, h: 6, dx: -52, dy: 0 },
  { x: 765, y: 466, w: 56, h: 16, dx: 0, dy: 14 },
];

export const PLAYER_SPAWN = { x: 794, y: 470 } as const;

export const NPC_SPAWNS = {
  kira: { x: 1110, y: 620, room: 'engineering' },
  leo: { x: 760, y: 610, room: 'medical' },
  maya: { x: 1000, y: 310, room: 'lab' },
} as const satisfies Record<string, { x: number; y: number; room: RoomId }>;

export const ROOM_CENTERS: Record<RoomId, { x: number; y: number }> = {
  bridge: { x: 800, y: 290 },
  quarters: { x: 470, y: 290 },
  lab: { x: 1060, y: 310 },
  storage: { x: 560, y: 570 },
  medical: { x: 780, y: 620 },
  common: { x: 940, y: 470 },
  engineering: { x: 1080, y: 610 },
  corridor: { x: 790, y: 440 },
};

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
