import { useEffect, useState } from 'react';
import { gameEvents, EVENTS } from '../../game/events';
import type { RoomId } from '../../game/world/shipLayout';
import { PinIcon } from './HudIcons';

/** How long the key hints stay after the player first moves (ms). */
const KEY_HINT_MS = 8000;

export const ROOM_NAMES: Record<RoomId, string> = {
  bridge: 'Bridge',
  quarters: 'Crew Quarters',
  lab: 'Lab & Greenhouse',
  common: 'Kitchen',
  engineering: 'Engineering',
  storage: 'Storage Bay',
  airlock: 'Airlock & Suits',
  gym: 'Gym & Health',
  corridor: 'Main Corridor',
};

/** Bottom-left HUD: current room + control hints. */
export function LocationHint() {
  const [room, setRoom] = useState<RoomId>('corridor');
  // Key hints help at the start; once the player is moving they fade out (they stay in Menu → How to play).
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
    <div className="hud-location">
      <div className="hud-location__room" key={room}>
        <PinIcon size={16} />
        {ROOM_NAMES[room]}
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
