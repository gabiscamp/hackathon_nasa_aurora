import { useCrewStore } from '../../stores/useCrewStore';
import { useGameStore } from '../../stores/useGameStore';
import { CREW_SLOTS } from '../../stores/useDutyStore';
import { getTeam } from '../../data/crews';
import type { CrewSlot } from '../../data/missions';

export interface RosterEntry {
  slot: CrewSlot;
  name: string;
  firstName: string;
  roleLabel: string;
  photo?: string;
  color: string;
  /** Personal health (the commander's is the station's Health bar). */
  health?: number;
}

const COMMANDER_COLOR = '#f5a623';

/** The four people on board, commander first (the commander is the player). */
export function useCrewRoster(): RosterEntry[] {
  const crew = useCrewStore((s) => s.crew);
  const crewId = useGameStore((s) => s.crewId);
  const playerName = useGameStore((s) => s.playerName);
  const commander = crewId ? getTeam(crewId).commander : null;

  return CREW_SLOTS.map((slot) => {
    if (slot === 'commander') {
      const name = playerName || commander?.name || 'Commander';
      return {
        slot,
        name: `${name} (you)`,
        firstName: name.split(' ')[0],
        roleLabel: commander?.roleLabel ?? 'Commander',
        photo: commander?.photo,
        color: COMMANDER_COLOR,
      };
    }
    const m = crew[slot];
    return {
      slot,
      name: m.name,
      firstName: m.name.replace('Dr. ', '').split(' ')[0],
      roleLabel: m.roleLabel,
      photo: m.photo,
      color: m.color,
      health: m.health,
    };
  });
}
