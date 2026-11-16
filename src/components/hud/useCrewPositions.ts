import { useEffect, useState } from 'react';
import { CREW_ROLES, type CrewRole } from '../../data/crew';
import { gameEvents, EVENTS, type CrewMovedPayload } from '../../game/events';
import { NPC_SPAWNS } from '../../game/world/shipLayout';

export type CrewMapPosition = { x: number; y: number; visible: boolean };
export type CrewMapPositions = Record<CrewRole, CrewMapPosition>;

const initialPositions = () => {
  const positions = {} as CrewMapPositions;
  for (const role of CREW_ROLES) {
    positions[role] = { ...NPC_SPAWNS[role], visible: true };
  }
  return positions;
};

// Keep the latest Phaser positions outside React so a newly opened map is immediately correct.
let lastPositions = initialPositions();
gameEvents.on(EVENTS.CREW_MOVED, ({ role, x, y, visible }: CrewMovedPayload) => {
  lastPositions = { ...lastPositions, [role]: { x, y, visible } };
});

/** Live world positions of every crew member, shared by the minimap and full map. */
export function useCrewPositions(): CrewMapPositions {
  const [positions, setPositions] = useState<CrewMapPositions>(lastPositions);

  useEffect(() => {
    const onMove = ({ role, x, y, visible }: CrewMovedPayload) => {
      setPositions((current) => ({ ...current, [role]: { x, y, visible } }));
    };
    gameEvents.on(EVENTS.CREW_MOVED, onMove);
    return () => {
      gameEvents.off(EVENTS.CREW_MOVED, onMove);
    };
  }, []);

  return positions;
}
