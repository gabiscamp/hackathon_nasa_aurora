import { WALKABLE_AREAS, WORLD_HEIGHT, WORLD_WIDTH, isBoxWalkable } from './stationLayout';

/**
 * Paths for the crew walking around the station on their own. The floor is cut into a grid;
 * a cell is open when a crew member's feet fit there (same box as the player's), so a path
 * goes round walls, furniture and through the doorways, never through them.
 */

export interface Point {
  x: number;
  y: number;
}

/** Grid cell size in world px: small enough for the narrow doorways. */
const CELL = 6;
/** Feet box, same as the player's (GameScene FEET_HALF_W / FEET_HALF_H). */
const FEET_HALF_W = 6;
const FEET_HALF_H = 3;

const COLS = Math.ceil(WORLD_WIDTH / CELL);
const ROWS = Math.ceil(WORLD_HEIGHT / CELL);

let open: Uint8Array | null = null;

function grid(): Uint8Array {
  if (open) return open;
  open = new Uint8Array(COLS * ROWS);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (isBoxWalkable(c * CELL + CELL / 2, r * CELL + CELL / 2, FEET_HALF_W, FEET_HALF_H)) open[r * COLS + c] = 1;
    }
  }
  return open;
}

const cellOf = (p: Point) => ({ c: Math.floor(p.x / CELL), r: Math.floor(p.y / CELL) });
const centerOf = (i: number): Point => ({ x: (i % COLS) * CELL + CELL / 2, y: Math.floor(i / COLS) * CELL + CELL / 2 });

/** The open cell nearest to a point (the point itself when it is open). */
function nearestOpen(p: Point): number | null {
  const g = grid();
  const { c, r } = cellOf(p);
  for (let ring = 0; ring <= 12; ring++) {
    for (let dr = -ring; dr <= ring; dr++) {
      for (let dc = -ring; dc <= ring; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== ring) continue;
        const cc = c + dc;
        const rr = r + dr;
        if (cc < 0 || rr < 0 || cc >= COLS || rr >= ROWS) continue;
        if (g[rr * COLS + cc]) return rr * COLS + cc;
      }
    }
  }
  return null;
}

/** True when the feet fit all along the straight line from a to b. */
function clearLine(a: Point, b: Point): boolean {
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 3);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (!isBoxWalkable(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, FEET_HALF_W, FEET_HALF_H)) return false;
  }
  return true;
}

/**
 * Waypoints from `from` to `to` (both moved to the nearest open floor), or null when there is
 * no way there. Breadth-first over the grid, then straightened: corners only where a wall is.
 */
export function findPath(from: Point, to: Point): Point[] | null {
  const g = grid();
  const start = nearestOpen(from);
  const goal = nearestOpen(to);
  if (start === null || goal === null) return null;
  const prev = new Int32Array(COLS * ROWS).fill(-1);
  prev[start] = start;
  const queue = new Int32Array(COLS * ROWS);
  let head = 0;
  let tail = 0;
  queue[tail++] = start;
  while (head < tail) {
    const i = queue[head++];
    if (i === goal) break;
    const c = i % COLS;
    const neighbours = [c > 0 ? i - 1 : -1, c < COLS - 1 ? i + 1 : -1, i - COLS, i + COLS];
    for (const n of neighbours) {
      if (n < 0 || n >= COLS * ROWS || !g[n] || prev[n] !== -1) continue;
      prev[n] = i;
      queue[tail++] = n;
    }
  }
  if (prev[goal] === -1) return null;

  const cells: Point[] = [];
  for (let i = goal; i !== start; i = prev[i]) cells.push(centerOf(i));
  cells.reverse();

  // Straighten: from each kept point, jump to the farthest point still in a clear line.
  const path: Point[] = [];
  let anchor = centerOf(start);
  let k = 0;
  while (k < cells.length) {
    let far = k;
    for (let j = cells.length - 1; j > k; j--) {
      if (clearLine(anchor, cells[j])) {
        far = j;
        break;
      }
    }
    anchor = cells[far];
    path.push(anchor);
    k = far + 1;
  }
  return path;
}

/** A random spot on the floor of the station (bigger rooms are picked more often). */
export function randomFloorPoint(rand: () => number = Math.random): Point | null {
  const total = WALKABLE_AREAS.reduce((s, a) => s + a.w * a.h, 0);
  for (let tries = 0; tries < 20; tries++) {
    let pick = rand() * total;
    const area = WALKABLE_AREAS.find((a) => (pick -= a.w * a.h) <= 0) ?? WALKABLE_AREAS[0];
    const p = { x: area.x + rand() * area.w, y: area.y + rand() * area.h };
    if (isBoxWalkable(p.x, p.y, FEET_HALF_W, FEET_HALF_H)) return p;
  }
  return null;
}

/** `p` moved a little by `offset` when the feet still fit there, else `p` itself. */
export function nudged(p: Point, offset: Point): Point {
  const q = { x: p.x + offset.x, y: p.y + offset.y };
  return isBoxWalkable(q.x, q.y, FEET_HALF_W, FEET_HALF_H) ? q : p;
}
