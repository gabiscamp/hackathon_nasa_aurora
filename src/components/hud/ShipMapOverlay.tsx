import { useEffect, useRef } from "react";
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
  type RoomId,
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
import { useMissionTarget } from "./useMissionTarget";

/** Where each room's name goes: the middle of its biggest floor area. */
const ROOM_LABELS = (() => {
  const best = new Map<RoomId, { x: number; y: number; area: number }>();
  for (const a of WALKABLE_AREAS) {
    if (a.room === "corridor") continue;
    const area = a.w * a.h;
    const prev = best.get(a.room);
    if (!prev || area > prev.area)
      best.set(a.room, { x: a.x + a.w / 2, y: a.y + a.h / 2, area });
  }
  // Crew pins stand at their spawn points; push a label down when it would sit under one.
  const spots = Object.values(NPC_SPAWNS);
  return [...best.entries()].map(([room, p]) => {
    const clash = spots.some(
      (s) => Math.abs(s.x - p.x) < 90 && Math.abs(s.y - p.y) < 70,
    );
    return { room, x: p.x, y: clash ? p.y + 55 : p.y };
  });
})();

/**
 * World region shown: the pressurized modules (every floor rect) plus a margin.
 * The solar wings at the far ends of the truss stay out, so room names have room.
 */
const VIEW = (() => {
  const PAD = 70;
  const x = Math.max(0, Math.min(...WALKABLE_AREAS.map((a) => a.x)) - PAD);
  const y = Math.max(0, Math.min(...WALKABLE_AREAS.map((a) => a.y)) - PAD * 2);
  const right = Math.min(WORLD_WIDTH, Math.max(...WALKABLE_AREAS.map((a) => a.x + a.w)) + PAD);
  const bottom = Math.min(WORLD_HEIGHT, Math.max(...WALKABLE_AREAS.map((a) => a.y + a.h)) + PAD);
  return { x, y, w: right - x, h: bottom - y };
})();

/** The station drawn from the same pieces the game places (flip, then rotate, then move). */
function StationDrawing() {
  return (
    <svg
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
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

const left = (x: number) => `${((x - VIEW.x) / VIEW.w) * 100}%`;
const top = (y: number) => `${((y - VIEW.y) / VIEW.h) * 100}%`;

/**
 * Full-screen ship map (M or click the minimap). Pauses the world like the menu does.
 * The station image is AI-generated, so it keeps the visible "AI-generated map" mark here too.
 */
export function ShipMapOverlay({ onClose }: { onClose: () => void }) {
  const pos = usePlayerPosition();
  const crew = useCrewStore((s) => s.crew);
  const target = useMissionTarget();
  const crewId = useGameStore((s) => s.crewId);
  const commander = crewId ? getTeam(crewId).commander : null;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    gameEvents.emit(EVENTS.MENU_OPENED);
    closeRef.current?.focus();
    return () => void gameEvents.emit(EVENTS.MENU_CLOSED);
  }, []);

  useEffect(() => {
    // Capture phase so Esc/P close the map instead of also opening the pause menu.
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key !== "escape" && key !== "m" && key !== "p") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

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
            className="ship-map__frame"
            style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}
          >
            <StationDrawing />
            <span className="ship-map__watermark">AI-generated map</span>

            {ROOM_LABELS.filter((r) => r.room !== target?.room).map((r) => (
              <span
                key={r.room}
                className="ship-map__room"
                style={{ left: left(r.x), top: top(r.y) }}
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
