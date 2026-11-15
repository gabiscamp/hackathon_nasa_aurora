import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { gameEvents, EVENTS } from "../../game/events";
import {
  NPC_SPAWNS,
  PLACEMENTS,
  STATION_SCALE,
  WALKABLE_AREAS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  placedCenter,
  type Placement,
} from "../../game/world/shipLayout";
import { PIECES } from "../../game/world/stationLayout";
import { STATION_TEXTURE_URLS } from "../../game/world/stationAssets";
import { useCrewStore } from "../../stores/useCrewStore";
import { useGameStore } from "../../stores/useGameStore";
import { getTeam } from "../../data/crews";
import { CREW_ROLES } from "../../data/crew";
import { ROOM_NAMES } from "./LocationHint";
import { MapIcon } from "./HudIcons";
import { usePlayerPosition } from "./usePlayerPosition";
import { useRobotPosition } from "./useRobotPosition";
import { useExplorationStore } from "../../stores/useExplorationStore";
import { RobotPortrait } from "../exploration/RobotPortrait";
import { useMissionTarget } from "./useMissionTarget";

const ROBOT_COLOR = "#9a5b32";

/** Size of a placed piece in world px (after rotation). */
function placedSize(p: Placement): { w: number; h: number } {
  const { width, height } = PIECES[p.piece];
  const sideways = p.angle === 90 || p.angle === -90;
  return {
    w: (sideways ? height : width) * STATION_SCALE,
    h: (sideways ? width : height) * STATION_SCALE,
  };
}

/** Cylinders of the pressurized row: their floor is a strip, so the name goes in the lower half. */
const ROW_PIECES = new Set(["node", "dormitory", "airlock"]);

/**
 * One name per module (both connection nodes too), on the module itself and no wider than it,
 * so neighbours never overlap on the small whole-station map. Crew pins stand above their spot,
 * so a module with a crew member gets its name a bit lower.
 */
const ROOM_LABELS = PLACEMENTS.flatMap((p) => {
  if (p.room === null) return [];
  const c = placedCenter(p);
  const { w, h } = placedSize(p);
  const crewHere = Object.values(NPC_SPAWNS).some(
    (s) => Math.abs(s.x - c.x) < w / 2 && Math.abs(s.y - c.y) < h / 2,
  );
  const lower = ROW_PIECES.has(p.piece) ? 0.2 : crewHere ? 0.25 : 0;
  return [{ room: p.room, x: c.x, y: c.y + h * lower, width: w }];
});

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The whole station (truss, radiators and solar wings too) plus a margin: the fully zoomed-out view. */
const STATION: Box = (() => {
  const PAD = 30;
  const boxes = PLACEMENTS.map((p) => {
    const c = placedCenter(p);
    const { w, h } = placedSize(p);
    return { x0: c.x - w / 2, y0: c.y - h / 2, x1: c.x + w / 2, y1: c.y + h / 2 };
  });
  const x = Math.max(0, Math.min(...boxes.map((b) => b.x0)) - PAD);
  const y = Math.max(0, Math.min(...boxes.map((b) => b.y0)) - PAD);
  const right = Math.min(WORLD_WIDTH, Math.max(...boxes.map((b) => b.x1)) + PAD);
  const bottom = Math.min(WORLD_HEIGHT, Math.max(...boxes.map((b) => b.y1)) + PAD);
  return { x, y, w: right - x, h: bottom - y };
})();

/** Middle of the rooms people walk in: where the map opens. */
const CREW_AREA_CENTER = (() => {
  const xs = WALKABLE_AREAS.flatMap((a) => [a.x, a.x + a.w]);
  const ys = WALKABLE_AREAS.flatMap((a) => [a.y, a.y + a.h]);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
})();

/** Width / height of the map frame (matches .ship-map__frame in Hud.css). */
const FRAME_ASPECT = 2;
/** Zoom 1 = the whole station across the frame. */
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const START_ZOOM = 2.2;
/** Below this zoom the modules are too small for their names, so names are hidden. */
const LABEL_ZOOM = 1.5;
const BUTTON_ZOOM_STEP = 1.4;
/** Share of the visible width moved by one arrow key press. */
const KEY_PAN_STEP = 0.15;

interface Camera {
  cx: number;
  cy: number;
  zoom: number;
}

/** World region on screen for a camera, kept inside the station (centred when it is bigger). */
function visibleBox({ cx, cy, zoom }: Camera): Box {
  const w = STATION.w / zoom;
  const h = w / FRAME_ASPECT;
  const clampAxis = (c: number, size: number, start: number, length: number) =>
    size >= length ? start + length / 2 : Math.min(Math.max(c, start + size / 2), start + length - size / 2);
  const x = clampAxis(cx, w, STATION.x, STATION.w) - w / 2;
  const y = clampAxis(cy, h, STATION.y, STATION.h) - h / 2;
  return { x, y, w, h };
}

/** Same camera, with its centre moved back inside the station so panning never drifts off. */
function clampCamera(cam: Camera): Camera {
  const zoom = Math.min(Math.max(cam.zoom, MIN_ZOOM), MAX_ZOOM);
  const v = visibleBox({ ...cam, zoom });
  return { cx: v.x + v.w / 2, cy: v.y + v.h / 2, zoom };
}

/** Camera zoomed by `factor` keeping the world point under (fx, fy) (0–1 of the frame) in place. */
function zoomAt(cam: Camera, factor: number, fx: number, fy: number): Camera {
  const v = visibleBox(cam);
  const wx = v.x + fx * v.w;
  const wy = v.y + fy * v.h;
  const zoom = Math.min(Math.max(cam.zoom * factor, MIN_ZOOM), MAX_ZOOM);
  const w = STATION.w / zoom;
  const h = w / FRAME_ASPECT;
  return clampCamera({ cx: wx - fx * w + w / 2, cy: wy - fy * h + h / 2, zoom });
}

const START_CAMERA = clampCamera({ cx: CREW_AREA_CENTER.x, cy: CREW_AREA_CENTER.y, zoom: START_ZOOM });

/** The station drawn from the same pieces the game places (flip, then rotate, then move). */
function StationDrawing({ view }: { view: Box }) {
  return (
    <svg
      viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
      role="img"
      aria-label="Top view of the whole station"
    >
      {[...PLACEMENTS]
        .sort((a, b) => a.depth - b.depth)
        .map((p, i) => {
          const c = placedCenter(p);
          const w = PIECES[p.piece].width * STATION_SCALE;
          const h = PIECES[p.piece].height * STATION_SCALE;
          return (
            <image
              key={i}
              href={STATION_TEXTURE_URLS[p.piece]}
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              transform={`translate(${c.x} ${c.y}) rotate(${p.angle}) scale(${p.flipX ? -1 : 1} ${p.flipY ? -1 : 1})`}
            />
          );
        })}
    </svg>
  );
}

/**
 * Full-screen ship map (M or click the minimap). Pauses the world like the menu does.
 * Zoom with the mouse wheel, + / − / 0 or the buttons; move by dragging or with the arrow keys.
 * Names and pins keep their size on screen, so zooming in spreads them apart.
 * The station image is AI-generated, so it keeps the visible "AI-generated map" mark here too.
 */
export function ShipMapOverlay({ onClose }: { onClose: () => void }) {
  const pos = usePlayerPosition();
  const robotPos = useRobotPosition();
  const crew = useCrewStore((s) => s.crew);
  const robotAboard = useExplorationStore((s) => s.status === "aboard");
  const target = useMissionTarget();
  const crewId = useGameStore((s) => s.crewId);
  const commander = crewId ? getTeam(crewId).commander : null;
  const closeRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState<Camera>(START_CAMERA);
  const drag = useRef<{ id: number; x: number; y: number; cam: Camera } | null>(null);
  const [dragging, setDragging] = useState(false);

  const view = visibleBox(camera);
  const left = (x: number) => `${((x - view.x) / view.w) * 100}%`;
  const top = (y: number) => `${((y - view.y) / view.h) * 100}%`;
  const showNames = camera.zoom >= LABEL_ZOOM;

  const zoomBy = (factor: number) => setCamera((c) => zoomAt(c, factor, 0.5, 0.5));
  const panBy = (dx: number, dy: number) =>
    setCamera((c) => {
      const v = visibleBox(c);
      return clampCamera({ ...c, cx: c.cx + dx * v.w, cy: c.cy + dy * v.w });
    });
  const showWholeStation = () => setCamera(clampCamera({ ...START_CAMERA, zoom: MIN_ZOOM }));

  useEffect(() => {
    gameEvents.emit(EVENTS.MENU_OPENED);
    closeRef.current?.focus();
    return () => void gameEvents.emit(EVENTS.MENU_CLOSED);
  }, []);

  useEffect(() => {
    // Capture phase so Esc/P close the map instead of also opening the pause menu.
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const pan: Record<string, [number, number]> = {
        arrowleft: [-KEY_PAN_STEP, 0],
        arrowright: [KEY_PAN_STEP, 0],
        arrowup: [0, -KEY_PAN_STEP],
        arrowdown: [0, KEY_PAN_STEP],
      };
      if (key === "escape" || key === "m" || key === "p") onClose();
      else if (key === "+" || key === "=") zoomBy(BUTTON_ZOOM_STEP);
      else if (key === "-" || key === "_") zoomBy(1 / BUTTON_ZOOM_STEP);
      else if (key === "0") showWholeStation();
      else if (pan[key]) panBy(...pan[key]);
      else return;
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  // Wheel zoom toward the cursor. Added by hand: React's wheel listener is passive, so it
  // could not stop the page from scrolling.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = frame.getBoundingClientRect();
      const factor = Math.exp(-e.deltaY * 0.0015);
      setCamera((c) => zoomAt(c, factor, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height));
    };
    frame.addEventListener("wheel", onWheel, { passive: false });
    return () => frame.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, cam: camera };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const r = e.currentTarget.getBoundingClientRect();
    const v = visibleBox(d.cam);
    setCamera(
      clampCamera({
        ...d.cam,
        cx: d.cam.cx - ((e.clientX - d.x) / r.width) * v.w,
        cy: d.cam.cy - ((e.clientY - d.y) / r.height) * v.h,
      }),
    );
  };
  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
  };

  // Portal to <body>: drawn above the Menu button and every other game layer.
  return createPortal(
    <div className="hud ship-map-layer">
      <div
        className="ship-map"
        role="dialog"
        aria-modal="true"
        aria-label="Ship map"
        onClick={onClose}
      >
        <div className="ship-map__card" onClick={(e) => e.stopPropagation()}>
          <header className="ship-map__head">
            <h2 className="ship-map__title">
              <MapIcon size={24} />
              Ship map
            </h2>
            <div className="ship-map__zoom" role="group" aria-label="Map zoom">
              <button
                type="button"
                className="ship-map__zoom-btn"
                onClick={() => zoomBy(1 / BUTTON_ZOOM_STEP)}
                disabled={camera.zoom <= MIN_ZOOM}
                aria-label="Zoom out (minus key)"
                title="Zoom out (−)"
              >
                −
              </button>
              <button
                type="button"
                className="ship-map__zoom-btn"
                onClick={() => zoomBy(BUTTON_ZOOM_STEP)}
                disabled={camera.zoom >= MAX_ZOOM}
                aria-label="Zoom in (plus key)"
                title="Zoom in (+)"
              >
                +
              </button>
              <button
                type="button"
                className="ship-map__zoom-btn ship-map__zoom-btn--wide"
                onClick={showWholeStation}
                title="See the whole station (0)"
              >
                Whole station <kbd>0</kbd>
              </button>
            </div>
            <button
              ref={closeRef}
              type="button"
              className="ship-map__close"
              onClick={onClose}
            >
              Close <kbd>M</kbd>
            </button>
          </header>

          <div
            ref={frameRef}
            className={`ship-map__frame ship-map__frame--pan${dragging ? " is-dragging" : ""}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <StationDrawing view={view} />
            <span className="ship-map__watermark">AI-generated map</span>
            <span className="ship-map__hint" aria-hidden="true">
              {showNames ? "Scroll to zoom · Drag to move" : "Zoom in to see the room names"}
            </span>

            {showNames &&
              ROOM_LABELS.filter((r) => r.room !== target?.room).map((r, i) => (
                <span
                  key={i}
                  className="ship-map__room"
                  style={{ left: left(r.x), top: top(r.y), maxWidth: `${(r.width / view.w) * 100}%` }}
                >
                  {ROOM_NAMES[r.room]}
                </span>
              ))}

            {CREW_ROLES.map((role) => {
              const m = crew[role];
              const spot = NPC_SPAWNS[role];
              return (
                <span
                  key={role}
                  className="ship-map__pin"
                  style={{
                    left: left(spot.x),
                    top: top(spot.y - 20),
                    ["--pin-color" as string]: m.color,
                  }}
                >
                  <span className="ship-map__face">
                    {m.photo ? <img src={m.photo} alt="" /> : m.name.charAt(0)}
                  </span>
                  <span className="ship-map__name">
                    {m.name.replace("Dr. ", "").split(" ")[0]}
                  </span>
                </span>
              );
            })}

            {robotAboard && (
              <span
                className="ship-map__pin ship-map__pin--robot"
                style={{
                  left: left(robotPos.x),
                  top: top(robotPos.y - 20),
                  ["--pin-color" as string]: ROBOT_COLOR,
                }}
              >
                <span className="ship-map__face"><RobotPortrait size={44} /></span>
                <span className="ship-map__name">AUR-1</span>
              </span>
            )}

            {target && (
              <span
                className="ship-map__pin ship-map__pin--mission"
                style={{
                  left: left(target.x),
                  top: top(target.y),
                  ["--pin-color" as string]: "var(--hud-red)",
                }}
              >
                <span className="ship-map__face" aria-hidden="true">!</span>
                <span className="ship-map__name">Mission: {ROOM_NAMES[target.room]}</span>
              </span>
            )}

            <span
              className="ship-map__pin ship-map__pin--you"
              style={{
                left: left(pos.x),
                top: top(pos.y - 20),
                ["--pin-color" as string]: "var(--hud-amber)",
              }}
            >
              <span className="ship-map__face">
                {commander?.photo ? (
                  <img src={commander.photo} alt="" />
                ) : (
                  "You"
                )}
              </span>
              <span className="ship-map__name">You</span>
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
