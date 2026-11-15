/**
 * Aurora Station layout, assembled ISS-style from the pieces built by
 * `scripts/build_station_assets.py` (src/assets/station/*.png):
 *
 *   - a long main truss with solar array wings at both ends and radiators,
 *   - a pressurized row under the truss:  Node A – Dormitory – Node B – Node C – Node D – Airlock,
 *   - rooms hanging from the node bottom hatches:
 *       Node A → Kitchen, Node B → Lab, Node C → Bathroom, Node D → Gym → Docking capsules.
 *
 * Pure data + math (no Phaser / Vite imports) so it can also be run by tooling.
 * Local rects are in piece-image pixels (as produced by the build script, before
 * rotation). The station is assembled in those "art pixels" and then scaled by
 * STATION_SCALE into world pixels, so rooms fit the ~47 px astronaut sprite.
 *
 * Room ids are the ones missions use (src/data/missions.ts):
 *   quarters = dormitory, lab = lab, common = kitchen, gym = gym + bathroom,
 *   airlock = airlock, storage = docking capsules (cargo arrives there),
 *   bridge = Node B, engineering = Node C (life support), corridor = Nodes A and D.
 */

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

/** World pixels per art pixel. */
export const STATION_SCALE = 0.45;

export type PieceKey =
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
  lab: {
    width: 743,
    height: 485,
    room: 'lab',
    floor: [
      { x: 300, y: 160, w: 145, h: 165 }, // central hub
      { x: 75, y: 255, w: 230, h: 50 }, // left wing
      { x: 440, y: 262, w: 262, h: 43 }, // right wing
      { x: 322, y: 88, w: 100, h: 75 }, // greenhouse arm
      { x: 348, y: 320, w: 55, h: 165 }, // storage arm → outer hatch
    ],
    blocked: [],
  },
  gym: {
    width: 750,
    height: 449,
    room: 'gym',
    floor: [
      { x: 98, y: 60, w: 552, h: 328 },
      { x: 340, y: 0, w: 75, h: 60 }, // top door
      { x: 340, y: 385, w: 75, h: 64 }, // bottom door
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
  },
  bathroom: {
    width: 388,
    height: 456,
    room: 'gym',
    floor: [
      { x: 145, y: 240, w: 135, h: 150 },
      { x: 165, y: 385, w: 60, h: 71 }, // door
    ],
    blocked: [{ x: 272, y: 292, w: 55, h: 75 }], // recycling bin
  },
  dormitory: {
    width: 668,
    height: 322,
    room: 'quarters',
    floor: [{ x: 15, y: 148, w: 640, h: 36 }],
    blocked: [],
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
  },
  airlock: {
    width: 626,
    height: 322,
    room: 'airlock',
    floor: [{ x: 15, y: 150, w: 460, h: 36 }], // stops at the outer hatch
    blocked: [],
  },
  truss: { width: 677, height: 208, room: null, floor: [], blocked: [] },
  radiator: { width: 636, height: 331, room: null, floor: [], blocked: [] },
  solar: { width: 958, height: 508, room: null, floor: [], blocked: [] },
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
const KITCHEN = place('kitchen', hatchX(0) - (743 - 377), HANG_Y, DEPTH.room, { angle: 180 });
const LAB = place('lab', hatchX(2) - (743 - 375), HANG_Y, DEPTH.room, { angle: 180 });
const BATHROOM = place('bathroom', hatchX(3) - (388 - 195), HANG_Y, DEPTH.room, { angle: 180 });
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
  KITCHEN,
  LAB,
  BATHROOM,
  GYM,
  CAPSULES,
  ...ROW,
];

export const WORLD_WIDTH = Math.ceil((TRUSS_RIGHT + 100) * STATION_SCALE);
export const WORLD_HEIGHT = Math.ceil((CAPSULES.y + PIECES.capsules.height + 130) * STATION_SCALE);

// ---------------------------------------------------------------------------
// Local → world transforms
// ---------------------------------------------------------------------------

/** Size of a placement's bounding box after rotation (art px). */
function placedSize(p: Placement): { w: number; h: number } {
  const def = PIECES[p.piece];
  return p.angle === 90 || p.angle === -90 ? { w: def.height, h: def.width } : { w: def.width, h: def.height };
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
  const du = lu - def.width / 2;
  const dv = lv - def.height / 2;
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
  scientist: { ...at(LAB, 372, 250), room: 'lab' },
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
