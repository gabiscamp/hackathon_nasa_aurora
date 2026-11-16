/**
 * Aurora Station layout, assembled ISS-style from the pieces built by
 * `scripts/build_station_assets.py` (src/assets/station/*.png):
 *
 *   - a long main truss with solar array wings at both ends and radiators,
 *   - a pressurized row under the truss:  Node A – Dormitory – Node B – Node C – Node D – Airlock,
 *   - rooms hanging from the node bottom hatches:
 *       Node A → Greenhouse → Kitchen, Node B → Lab, Node C → Bathroom,
 *       Node D → Gym → Docking capsules.
 *
 * Pure data + math (no Phaser / Vite imports) so it can also be run by tooling.
 * Local rects are in piece-image pixels (as produced by the build script, before
 * rotation). The station is assembled in those "art pixels" and then scaled by
 * STATION_SCALE into world pixels, so rooms fit the ~47 px astronaut sprite.
 *
 * Room ids are the ones missions use (src/data/missions.ts); shown names are in
 * src/components/hud/LocationHint.tsx (ROOM_NAMES):
 *   quarters = dormitory, lab = lab, greenhouse = greenhouse, common = kitchen, gym = gym,
 *   bathroom = bathroom, airlock = airlock, storage = docking capsules ("Cargo Bay"),
 *   bridge = Node B ("Command Node"), engineering = Node C ("Life Support Node"),
 *   corridor = Nodes A and D ("Connection Node").
 */

export type RoomId =
  | 'bridge'
  | 'quarters'
  | 'lab'
  | 'greenhouse'
  | 'common'
  | 'engineering'
  | 'storage'
  | 'airlock'
  | 'gym'
  | 'bathroom'
  | 'corridor';

/** World pixels per art pixel. */
export const STATION_SCALE = 0.45;

/** Individual module scale, in addition to the station-wide scale. */
export function pieceScale(piece: PieceKey): number {
  return piece === 'lab' ? 1.2 : 1;
}

export type PieceKey =
  | 'greenhouse'
  | 'lab'
  | 'gym'
  | 'kitchen'
  | 'capsules'
  | 'bathroom'
  | 'dormitory'
  | 'node'
  | 'airlock'
  | 'truss'
  | 'radiator'
  | 'solar';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WalkableArea extends Rect {
  room: RoomId;
}

export interface PieceDef {
  /** Size of the built PNG (px). Must match src/assets/station/<key>.png. */
  width: number;
  height: number;
  /** Room the floor belongs to; null for exterior decoration (truss, panels…). */
  room: RoomId | null;
  /** Floor the player may stand on (local px, unrotated image). */
  floor: readonly Rect[];
  /** Furniture / equipment carved out of the floor (local px). */
  blocked: readonly Rect[];
  /**
   * Wall parts drawn again above the characters (local px): hatch rings, cylinder
   * end caps and south door walls, so the crew walks *under* them (top-down look).
   */
  overhead: readonly Rect[];
}

export type Angle = 0 | 90 | 180 | -90;

export interface Placement {
  piece: PieceKey;
  /** Overrides the piece's room (e.g. which node is the bridge). */
  room: RoomId | null;
  /** Top-left corner of the placed (already rotated) bounding box, art px. */
  x: number;
  y: number;
  /** Clockwise rotation in degrees (Phaser convention). */
  angle: Angle;
  flipX: boolean;
  flipY: boolean;
  depth: number;
}

export const PIECES: Record<PieceKey, PieceDef> = {
  greenhouse: {
    width: 747,
    height: 418,
    room: 'greenhouse',
    floor: [
      { x: 335, y: 0, w: 75, h: 418 }, // center aisle, top door → bottom door
      { x: 115, y: 178, w: 520, h: 50 }, // cross aisle between the grow beds
    ],
    blocked: [],
    overhead: [{ x: 0, y: 342, w: 747, h: 76 }], // south wall with the door to the kitchen
  },
  // "modulo-laboratorial- invertido.jpeg": open entry arm (door) on top, small greenhouse at the bottom.
  lab: {
    width: 744,
    height: 492,
    room: 'lab',
    floor: [
      { x: 350, y: 0, w: 50, h: 45 }, // top door, between the orange posts
      { x: 320, y: 40, w: 110, h: 95 }, // entry arm
      { x: 350, y: 128, w: 50, h: 45 }, // entry arm → hub
      { x: 300, y: 168, w: 145, h: 150 }, // central hub
      { x: 60, y: 241, w: 245, h: 64 }, // left wing
      { x: 445, y: 241, w: 250, h: 64 }, // right wing
      { x: 350, y: 308, w: 50, h: 50 }, // hub → greenhouse arm
      { x: 335, y: 348, w: 90, h: 38 }, // greenhouse arm, in front of the planters
    ],
    blocked: [
      { x: 328, y: 10, w: 20, h: 42 }, // door posts
      { x: 402, y: 10, w: 20, h: 42 },
      { x: 303, y: 175, w: 38, h: 55 }, // hub pillars
      { x: 407, y: 175, w: 38, h: 55 },
      { x: 303, y: 265, w: 38, h: 45 },
      { x: 407, y: 265, w: 38, h: 45 },
      { x: 75, y: 233, w: 42, h: 75 }, // DNA poster cabinet
      { x: 140, y: 233, w: 48, h: 28 }, // centrifuge base
      { x: 150, y: 265, w: 68, h: 40 }, // left table
      { x: 228, y: 269, w: 26, h: 36 }, // left drawers
      { x: 270, y: 281, w: 32, h: 24 }, // left wall monitor
      { x: 443, y: 279, w: 34, h: 26 }, // right wall monitor
      { x: 493, y: 269, w: 27, h: 36 }, // right drawers
      { x: 520, y: 253, w: 78, h: 45 }, // right table
      { x: 607, y: 269, w: 26, h: 28 }, // stool
      { x: 648, y: 243, w: 36, h: 62 }, // orange analyzer
    ],
    overhead: [], // its door is on top, under the node's hatch ring
  },
  gym: {
    width: 750,
    height: 449,
    room: 'gym',
    floor: [
      { x: 98, y: 60, w: 552, h: 312 }, // stops at the south wall
      { x: 340, y: 0, w: 75, h: 60 }, // top door
      { x: 340, y: 360, w: 75, h: 89 }, // bottom door
    ],
    blocked: [
      { x: 108, y: 80, w: 190, h: 150 }, // weight rack
      { x: 430, y: 85, w: 215, h: 145 }, // treadmill
      { x: 138, y: 250, w: 160, h: 118 }, // exercise bike
      { x: 462, y: 288, w: 200, h: 100 }, // lockers + cables
      { x: 598, y: 240, w: 62, h: 60 }, // wall console
      { x: 298, y: 65, w: 40, h: 135 }, // left post
      { x: 415, y: 120, w: 30, h: 100 }, // right post
    ],
    overhead: [{ x: 0, y: 372, w: 750, h: 77 }], // south wall with the door to the capsules
  },
  kitchen: {
    width: 743,
    height: 463,
    room: 'common',
    floor: [
      { x: 200, y: 150, w: 390, h: 250 },
      { x: 340, y: 395, w: 70, h: 68 }, // door
    ],
    blocked: [
      { x: 278, y: 192, w: 218, h: 130 }, // table
      { x: 130, y: 335, w: 130, h: 70 }, // bins
      { x: 495, y: 330, w: 110, h: 75 }, // cabinet
    ],
    overhead: [], // placed upside down: its door is on top, under the node's hatch ring
  },
  capsules: {
    width: 816,
    height: 408,
    room: 'storage',
    floor: [
      { x: 350, y: 0, w: 115, h: 395 }, // center aisle (top door → docking port)
      { x: 110, y: 165, w: 600, h: 75 }, // cross aisle between the pods
    ],
    blocked: [],
    overhead: [{ x: 0, y: 368, w: 816, h: 40 }], // south wall with the docking port
  },
  // banheiro-invertido.jpeg: door on top.
  bathroom: {
    width: 396,
    height: 462,
    room: 'bathroom',
    floor: [
      { x: 168, y: 0, w: 58, h: 85 }, // top door, between the orange posts
      { x: 145, y: 80, w: 150, h: 295 },
    ],
    blocked: [
      { x: 140, y: 112, w: 82, h: 150 }, // toilet
      { x: 270, y: 80, w: 30, h: 160 }, // hose + wall console
    ],
    overhead: [], // its door is on top, under the node's hatch ring
  },
  dormitory: {
    width: 668,
    height: 322,
    room: 'quarters',
    floor: [{ x: 15, y: 148, w: 640, h: 36 }],
    blocked: [],
    overhead: [
      { x: 0, y: 0, w: 132, h: 322 }, // left end cap + hatch
      { x: 530, y: 0, w: 138, h: 322 }, // right end cap + hatch
    ],
  },
  node: {
    width: 668,
    height: 350,
    room: 'corridor',
    floor: [
      { x: 15, y: 145, w: 640, h: 40 }, // left hatch ↔ right hatch
      { x: 300, y: 145, w: 80, h: 205 }, // down to the bottom hatch
    ],
    blocked: [],
    overhead: [
      { x: 0, y: 0, w: 118, h: 350 }, // left end cap + hatch
      { x: 550, y: 0, w: 118, h: 350 }, // right end cap + hatch
      { x: 118, y: 262, w: 432, h: 88 }, // bottom hull + hatch ring
    ],
  },
  airlock: {
    width: 626,
    height: 322,
    room: 'airlock',
    floor: [{ x: 15, y: 150, w: 460, h: 36 }], // stops at the outer hatch
    blocked: [],
    // Only the hull edge on the node side; the open outer hatch stays behind the crew.
    overhead: [{ x: 0, y: 0, w: 22, h: 322 }],
  },
  truss: { width: 677, height: 208, room: null, floor: [], blocked: [], overhead: [] },
  radiator: { width: 636, height: 331, room: null, floor: [], blocked: [], overhead: [] },
  solar: { width: 958, height: 508, room: null, floor: [], blocked: [], overhead: [] },
};

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

// Everything below is in art px until the "Local → world transforms" section.

/** y of the pressurized row's walking line. */
const BAND_Y = 1360;
/** x of the left edge of the pressurized row. */
const ROW_X = 2100;
/** Neighbouring cylinders overlap 40px so their hatch rings mate. */
const ROW_STEP = PIECES.node.width - 40;
/** Local y of the walking line inside node/dormitory (165) and airlock (167). */
const NODE_TOP = BAND_Y - 165;
const ROW_BOTTOM = NODE_TOP + PIECES.node.height;
/** Rooms overlap the node bottom hatch by 30px. */
const HANG_Y = ROW_BOTTOM - 30;
/** Local x of the node bottom hatch passage center. */
const NODE_HATCH_X = 340;

const DEPTH = {
  solar: 0,
  radiator: 1,
  truss: 2,
  room: 3,
  cylinder: 4,
  node: 5,
} as const;

function place(
  piece: PieceKey,
  x: number,
  y: number,
  depth: number,
  opts: { angle?: Angle; flipX?: boolean; flipY?: boolean; room?: RoomId } = {},
): Placement {
  return {
    piece,
    room: opts.room ?? PIECES[piece].room,
    x,
    y,
    depth,
    angle: opts.angle ?? 0,
    flipX: opts.flipX ?? false,
    flipY: opts.flipY ?? false,
  };
}

const rowX = (i: number) => ROW_X + i * ROW_STEP;
const hatchX = (i: number) => rowX(i) + NODE_HATCH_X;

// Pressurized row
const ROW: Placement[] = [
  place('node', rowX(0), NODE_TOP, DEPTH.node), // Node A (corridor)
  place('dormitory', rowX(1), NODE_TOP, DEPTH.cylinder),
  place('node', rowX(2), NODE_TOP, DEPTH.node, { room: 'bridge' }), // Node B
  place('node', rowX(3), NODE_TOP, DEPTH.node, { room: 'engineering' }), // Node C
  place('node', rowX(4), NODE_TOP, DEPTH.node), // Node D (corridor)
  place('airlock', rowX(5), BAND_Y - 167, DEPTH.cylinder),
];
const ROW_RIGHT = rowX(5) + PIECES.airlock.width;
const ROW_CENTER_X = (ROW_X + ROW_RIGHT) / 2;

// Rooms under the node bottom hatches. Rotated 180° rooms have their door on
// top; the door's x is mirrored (width - local door x).
// Greenhouse grows food right above the kitchen (doors top and bottom, like the gym).
const GREENHOUSE = place('greenhouse', hatchX(0) - 377, HANG_Y, DEPTH.room);
const KITCHEN = place('kitchen', hatchX(0) - (743 - 377), HANG_Y + PIECES.greenhouse.height - 25, DEPTH.room, {
  angle: 180,
});
const LAB = place('lab', hatchX(2) - 375 * pieceScale('lab'), HANG_Y, DEPTH.room);
const BATHROOM = place('bathroom', hatchX(3) - 197, HANG_Y, DEPTH.room);
const GYM = place('gym', hatchX(4) - 377, HANG_Y, DEPTH.room);
const CAPSULES = place('capsules', hatchX(4) - 410, HANG_Y + PIECES.gym.height - 25, DEPTH.room);

// Main truss: segments overlap on their end connectors.
const TRUSS_STEP = 590;
const TRUSS_COUNT = 13;
const TRUSS_LENGTH = PIECES.truss.width + (TRUSS_COUNT - 1) * TRUSS_STEP;
const TRUSS_X = ROW_CENTER_X - TRUSS_LENGTH / 2;
const TRUSS_Y = NODE_TOP + 20 - PIECES.truss.height;
const TRUSS: Placement[] = Array.from({ length: TRUSS_COUNT }, (_, i) =>
  place('truss', TRUSS_X + i * TRUSS_STEP, TRUSS_Y, DEPTH.truss),
);
const TRUSS_RIGHT = TRUSS_X + TRUSS_LENGTH;

// Solar wings, rotated so their connector plugs into the truss
// (+90 → connector at the bottom, -90 → connector at the top).
const SOLAR_W = PIECES.solar.height; // rotated
const SOLAR_H = PIECES.solar.width;
const SOLAR_PITCH = 560;
const solarXs = [
  TRUSS_X + 60,
  TRUSS_X + 60 + SOLAR_PITCH,
  TRUSS_RIGHT - 60 - SOLAR_W - SOLAR_PITCH,
  TRUSS_RIGHT - 60 - SOLAR_W,
];
const SOLAR: Placement[] = solarXs.flatMap((x) => [
  place('solar', x, TRUSS_Y + 70 - SOLAR_H, DEPTH.solar, { angle: 90 }),
  place('solar', x, TRUSS_Y + PIECES.truss.height - 70, DEPTH.solar, { angle: -90 }),
]);

// Radiators: two above the truss over the row, one below the truss at each end of the row.
const RAD_W = PIECES.radiator.width;
const RAD_H = PIECES.radiator.height;
const RADIATORS: Placement[] = [
  place('radiator', ROW_CENTER_X - 760 - RAD_W / 2, TRUSS_Y + 40 - RAD_H, DEPTH.radiator, { flipY: true }),
  place('radiator', ROW_CENTER_X + 760 - RAD_W / 2, TRUSS_Y + 40 - RAD_H, DEPTH.radiator, { flipY: true, flipX: true }),
  place('radiator', ROW_X - 120 - RAD_W, TRUSS_Y + 165, DEPTH.radiator),
  place('radiator', ROW_RIGHT + 120, TRUSS_Y + 165, DEPTH.radiator, { flipX: true }),
];

export const PLACEMENTS: readonly Placement[] = [
  ...SOLAR,
  ...RADIATORS,
  ...TRUSS,
  GREENHOUSE,
  KITCHEN,
  LAB,
  BATHROOM,
  GYM,
  CAPSULES,
  ...ROW,
];

export const WORLD_WIDTH = Math.ceil((TRUSS_RIGHT + 100) * STATION_SCALE);
const LOWEST_ROOM_BOTTOM = Math.max(CAPSULES.y + PIECES.capsules.height, KITCHEN.y + PIECES.kitchen.height);
export const WORLD_HEIGHT = Math.ceil((LOWEST_ROOM_BOTTOM + 130) * STATION_SCALE);

// ---------------------------------------------------------------------------
// Local → world transforms
// ---------------------------------------------------------------------------

/** Size of a placement's bounding box after rotation (art px). */
function placedSize(p: Placement): { w: number; h: number } {
  const def = PIECES[p.piece];
  const scale = pieceScale(p.piece);
  return p.angle === 90 || p.angle === -90 ? { w: def.height * scale, h: def.width * scale } : { w: def.width * scale, h: def.height * scale };
}

/** Art-px center of the placement. */
function artCenter(p: Placement): { x: number; y: number } {
  const { w, h } = placedSize(p);
  return { x: p.x + w / 2, y: p.y + h / 2 };
}

/** World position of the placement's center (Phaser image origin 0.5, scale STATION_SCALE). */
export function placedCenter(p: Placement): { x: number; y: number } {
  const c = artCenter(p);
  return { x: c.x * STATION_SCALE, y: c.y * STATION_SCALE };
}

function toWorld(p: Placement, u: number, v: number): { x: number; y: number } {
  const def = PIECES[p.piece];
  const lu = p.flipX ? def.width - u : u;
  const lv = p.flipY ? def.height - v : v;
  const du = (lu - def.width / 2) * pieceScale(p.piece);
  const dv = (lv - def.height / 2) * pieceScale(p.piece);
  let rx: number;
  let ry: number;
  switch (p.angle) {
    case 90:
      rx = -dv;
      ry = du;
      break;
    case 180:
      rx = -du;
      ry = -dv;
      break;
    case -90:
      rx = dv;
      ry = -du;
      break;
    default:
      rx = du;
      ry = dv;
  }
  const c = artCenter(p);
  return { x: (c.x + rx) * STATION_SCALE, y: (c.y + ry) * STATION_SCALE };
}

function rectToWorld(p: Placement, r: Rect): Rect {
  const a = toWorld(p, r.x, r.y);
  const b = toWorld(p, r.x + r.w, r.y + r.h);
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(b.x - a.x),
    h: Math.abs(b.y - a.y),
  };
}

/** Floor rects in world space. Rooms come before nodes so doorway overlaps report the room. */
export const WALKABLE_AREAS: readonly WalkableArea[] = PLACEMENTS.filter((p) => p.room !== null)
  .sort((a, b) => Number(a.piece === 'node') - Number(b.piece === 'node'))
  .flatMap((p) => {
    const room = p.room as RoomId;
    return PIECES[p.piece].floor.map((r) => ({ ...rectToWorld(p, r), room }));
  });

export const BLOCKED_AREAS: readonly Rect[] = PLACEMENTS.flatMap((p) =>
  PIECES[p.piece].blocked.map((r) => rectToWorld(p, r)),
);

/** World point at a local position of a placement (for spawns). */
function at(p: Placement, u: number, v: number): { x: number; y: number } {
  const w = toWorld(p, u, v);
  return { x: Math.round(w.x), y: Math.round(w.y) };
}

/** Player wakes up in the crew quarters. */
export const PLAYER_SPAWN = at(ROW[1], 334, 168);

/** Where each crew role works; keys match CrewRole in src/data/crew.ts. */
export const NPC_SPAWNS = {
  engineer: { ...at(ROW[3], 180, 168), room: 'engineering' },
  medic: { ...at(GYM, 377, 245), room: 'gym' },
  scientist: { ...at(LAB, 374, 247), room: 'lab' },
} as const satisfies Record<string, { x: number; y: number; room: RoomId }>;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const contains = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

export function isPointWalkable(x: number, y: number): boolean {
  return WALKABLE_AREAS.some((a) => contains(a, x, y)) && !BLOCKED_AREAS.some((b) => contains(b, x, y));
}

/** True when every corner of the box lies on walkable floor. */
export function isBoxWalkable(cx: number, cy: number, halfW: number, halfH: number): boolean {
  return (
    isPointWalkable(cx - halfW, cy - halfH) &&
    isPointWalkable(cx + halfW, cy - halfH) &&
    isPointWalkable(cx - halfW, cy + halfH) &&
    isPointWalkable(cx + halfW, cy + halfH)
  );
}

export function roomAt(x: number, y: number): RoomId | null {
  const area = WALKABLE_AREAS.find((a) => contains(a, x, y));
  return area ? area.room : null;
}
