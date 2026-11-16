import { useEffect, useState } from 'react';
import { gameEvents, EVENTS } from '../../game/events';
import type { RoomId } from '../../game/world/shipLayout';
import { PinIcon } from './HudIcons';

/** How long the key hints stay after the player first moves (ms). */
const KEY_HINT_MS = 8000;

/** Shown name of each room; which module each id is: see stationLayout.ts. */
export const ROOM_NAMES: Record<RoomId, string> = {
  bridge: 'Command Node',
  quarters: 'Crew Quarters',
  lab: 'Science Lab',
  greenhouse: 'Greenhouse',
  common: 'Kitchen',
  engineering: 'Life Support Node',
  storage: 'Cargo Bay',
  airlock: 'Airlock & Suits',
  gym: 'Gym',
  bathroom: 'Bathroom',
  corridor: 'Connection Node',
};

/** Bottom-left HUD: current room + control hints. */
export function LocationHint() {
  const [room, setRoom] = useState<RoomId>('corridor');
  // Key hints help at the start; once the player is moving they fade out (they stay in Help / H).
  const [showKeys, setShowKeys] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onMove = () => {
      if (timer) return;
      timer = setTimeout(() => setShowKeys(false), KEY_HINT_MS);
    };
    gameEvents.on(EVENTS.PLAYER_MOVED, onMove);
    return () => {
      gameEvents.off(EVENTS.PLAYER_MOVED, onMove);
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const onEnter = (r: RoomId) => setRoom(r);
    gameEvents.on(EVENTS.ENTER_ROOM, onEnter);
    return () => {
      gameEvents.off(EVENTS.ENTER_ROOM, onEnter);
    };
  }, []);

  return (
    <div className="hud-location" data-read>
      <div className="hud-location__room" key={room} role="status" aria-live="polite" aria-atomic="true">
        <PinIcon size={16} />
        <span className="sr-only">Current location: </span>{ROOM_NAMES[room]}
      </div>
      {showKeys && (
        <div className="hud-location__keys">
          <kbd>WASD</kbd> Move
          <kbd>E</kbd> Interact
          <kbd>M</kbd> Map
        </div>
      )}
    </div>
  );
}
