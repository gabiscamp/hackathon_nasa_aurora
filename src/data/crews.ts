import type { CrewMemberDefinition, CrewRole } from './crew';
import { getAstronaut, toCrewMember, toSeat, type Astronaut, type SeatProfile, type SeatRole } from './astronauts';

/**
 * The two crews the player can choose on the home screen: Options A and B of the team
 * briefing, all real astronauts. Marcos Pontes and Serena Auñón-Chancellor fly in both.
 * The player plays as the crew's Commander.
 *
 * Every crew member has their own pixel-art head, drawn per crew by the team
 * (public/assets/cabecas/equipe1.png = Crew A, equipe2.png = Crew B; built into the
 * game atlas by scripts/build_head_sheets.py). So the same astronaut can look a little
 * different in each crew.
 *
 * A crew id lists its members ("crew-mcclain-pontes-aunon-schmitt"), so a saved game
 * can rebuild the same crew.
 */

/** Head ids in src/assets/cabecas/exports/equipes/cabecas.json ("<crew>-<astronaut>"). */
export const HEAD_IDS = [
  'a-mcclain',
  'a-pontes',
  'a-aunon',
  'a-schmitt',
  'b-armstrong',
  'b-pontes',
  'b-aunon',
  'b-watkins',
] as const;
export type HeadId = (typeof HEAD_IDS)[number];

export interface CrewTeam {
  id: string;
  name: string;
  /** One short sentence shown on the crew card. */
  tagline: string;
  /** The player's character. */
  commander: SeatProfile;
  members: Record<CrewRole, CrewMemberDefinition>;
  /** The three crew members as cards (engineer, medic, scientist). */
  seats: SeatProfile[];
  /** Pixel-art head of each seat in this crew. */
  heads: Record<SeatRole, HeadId>;
}

interface Lineup {
  commander: Astronaut;
  engineer: Astronaut & { role: 'engineer' };
  medic: Astronaut & { role: 'medic' };
  scientist: Astronaut & { role: 'scientist' };
}

interface TeamDefinition {
  name: string;
  /** Astronaut ids: commander, engineer, medic, scientist. */
  ids: readonly [string, string, string, string];
  heads: Record<SeatRole, HeadId>;
}

const ID_PREFIX = 'crew-';

const TEAM_DEFINITIONS: readonly TeamDefinition[] = [
  {
    name: 'Crew A',
    ids: ['mcclain', 'pontes', 'aunon', 'schmitt'],
    heads: { commander: 'a-mcclain', engineer: 'a-pontes', medic: 'a-aunon', scientist: 'a-schmitt' },
  },
  {
    name: 'Crew B',
    ids: ['armstrong', 'pontes', 'aunon', 'watkins'],
    heads: { commander: 'b-armstrong', engineer: 'b-pontes', medic: 'b-aunon', scientist: 'b-watkins' },
  },
];

/** Builds a lineup from astronaut ids; undefined if any id is unknown or in the wrong seat. */
function lineupFromIds(ids: readonly string[]): Lineup | undefined {
  const [commander, engineer, medic, scientist] = ids.map(getAstronaut);
  if (
    commander?.role === 'commander' &&
    engineer?.role === 'engineer' &&
    medic?.role === 'medic' &&
    scientist?.role === 'scientist'
  ) {
    return {
      commander,
      engineer: engineer as Lineup['engineer'],
      medic: medic as Lineup['medic'],
      scientist: scientist as Lineup['scientist'],
    };
  }
  return undefined;
}

function buildTeam(def: TeamDefinition): CrewTeam {
  const lineup = lineupFromIds(def.ids);
  if (!lineup) throw new Error(`Bad crew lineup: ${def.ids.join(', ')}`);
  return {
    id: `${ID_PREFIX}${def.ids.join('-')}`,
    name: def.name,
    tagline: `Led by Commander ${lineup.commander.name}.`,
    commander: toSeat(lineup.commander),
    members: {
      engineer: toCrewMember(lineup.engineer),
      medic: toCrewMember(lineup.medic),
      scientist: toCrewMember(lineup.scientist),
    },
    seats: [toSeat(lineup.engineer), toSeat(lineup.medic), toSeat(lineup.scientist)],
    heads: def.heads,
  };
}

/** Crew A (Anne McClain) and Crew B (Neil Armstrong). The player picks one. */
export const TEAMS: readonly CrewTeam[] = TEAM_DEFINITIONS.map(buildTeam);

export const DEFAULT_TEAM_ID = TEAMS[0].id;

/**
 * Crew of a saved game. Saves from when crew members were drawn at random keep their
 * commander's crew; unknown ids fall back to Crew A.
 */
export function getTeam(id: string): CrewTeam {
  const exact = TEAMS.find((t) => t.id === id);
  if (exact) return exact;
  const commanderId = id.startsWith(ID_PREFIX) ? id.slice(ID_PREFIX.length).split('-')[0] : '';
  return TEAMS.find((t) => t.commander.astronautId === commanderId) ?? TEAMS[0];
}
