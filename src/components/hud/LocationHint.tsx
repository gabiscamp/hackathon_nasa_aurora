import { useEffect, useState } from 'react';
import { gameEvents, EVENTS } from '../../game/events';
import type { RoomId } from '../../game/world/shipLayout';
import { PinIcon } from './HudIcons';

const ROOM_NAMES: Record<RoomId, string> = {
  bridge: 'Bridge',
  quarters: 'Crew Quarters',
  lab: 'Science Lab',
  storage: 'Storage Bay',
  medical: 'Medical Bay',
  common: 'Common Room',
  engineering: 'Engineering',
  corridor: 'Corridor',
};

/** Bottom-left HUD: current room + control hints. */
export function LocationHint() {
  const [room, setRoom] = useState<RoomId>('corridor');

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
      <div className="hud-location__keys">
        <kbd>WASD</kbd> Move
        <kbd>E</kbd> Interact
      </div>
    </div>
  );
}
