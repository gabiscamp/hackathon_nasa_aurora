import { useGameStore } from '../../stores/useGameStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { ROOM_CENTERS, type RoomId } from '../../game/world/shipLayout';
import { getMission } from '../../data/missions';

export interface MissionTarget {
  id: string;
  title: string;
  room: RoomId;
  critical: boolean;
  x: number;
  y: number;
}

/**
 * Every problem waiting on the map (decision phase): same spots as the "!" in the ship.
 * Problems in the same room sit side by side, like in GameScene.setMissionMarkers.
 */
export function useMissionTargets(): MissionTarget[] {
  const phase = useGameStore((s) => s.phase);
  const openEvents = useMissionStore((s) => s.openEvents);
  if (phase !== 'decision') return [];
  const perRoom = new Map<string, number>();
  return openEvents.flatMap((id) => {
    const m = getMission(id);
    const center = m ? ROOM_CENTERS[m.room as RoomId] : undefined;
    if (!m || !center) return [];
    const index = perRoom.get(m.room) ?? 0;
    perRoom.set(m.room, index + 1);
    return [{ id, title: m.title, room: m.room as RoomId, critical: m.severity === 'critical', x: center.x + index * 70, y: center.y }];
  });
}
