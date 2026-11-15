import { useGameStore } from '../../stores/useGameStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { ROOM_CENTERS, type RoomId } from '../../game/world/shipLayout';

export interface MissionTarget {
  room: RoomId;
  x: number;
  y: number;
}

/** The room the player must walk to right now (decision phase), or null. Same spot as the "!" in the ship. */
export function useMissionTarget(): MissionTarget | null {
  const phase = useGameStore((s) => s.phase);
  const mission = useMissionStore((s) => s.currentMission);
  if (phase !== 'decision' || !mission) return null;
  const room = mission.room as RoomId;
  const center = ROOM_CENTERS[room];
  return center ? { room, x: center.x, y: center.y } : null;
}
