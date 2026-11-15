import { useEffect, useState } from 'react';
import { gameEvents, EVENTS, type PlayerMovedPayload } from '../../game/events';
import { PLAYER_SPAWN } from '../../game/world/shipLayout';

// Last position Phaser reported, kept so a map opened later starts at the right spot.
let lastPosition: PlayerMovedPayload = { x: PLAYER_SPAWN.x, y: PLAYER_SPAWN.y };
gameEvents.on(EVENTS.PLAYER_MOVED, (p: PlayerMovedPayload) => {
  lastPosition = { x: p.x, y: p.y };
});

/** Player position in world pixels, updated from the PLAYER_MOVED event. */
export function usePlayerPosition(): PlayerMovedPayload {
  const [pos, setPos] = useState<PlayerMovedPayload>(lastPosition);
  useEffect(() => {
    const onMove = (p: PlayerMovedPayload) => setPos({ x: p.x, y: p.y });
    gameEvents.on(EVENTS.PLAYER_MOVED, onMove);
    return () => {
      gameEvents.off(EVENTS.PLAYER_MOVED, onMove);
    };
  }, []);
  return pos;
}
