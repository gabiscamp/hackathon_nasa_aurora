import { useEffect, useState } from 'react';
import { gameEvents, EVENTS, type PlayerMovedPayload } from '../../game/events';
import { ROOM_CENTERS } from '../../game/world/shipLayout';

let lastRobotPosition: PlayerMovedPayload = { ...ROOM_CENTERS.bridge };
gameEvents.on(EVENTS.ROBOT_MOVED, (position: PlayerMovedPayload) => {
  lastRobotPosition = { x: position.x, y: position.y };
});

/** Last AUR-1 world position emitted by Phaser, shared by both ship maps. */
export function useRobotPosition(): PlayerMovedPayload {
  const [position, setPosition] = useState<PlayerMovedPayload>(lastRobotPosition);

  useEffect(() => {
    const onMove = (next: PlayerMovedPayload) => setPosition({ x: next.x, y: next.y });
    gameEvents.on(EVENTS.ROBOT_MOVED, onMove);
    return () => { gameEvents.off(EVENTS.ROBOT_MOVED, onMove); };
  }, []);

  return position;
}
