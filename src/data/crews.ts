import type { CrewMemberDefinition, CrewRole } from './crew';
import { astronautsFor, getAstronaut, toCrewMember, toSeat, type Astronaut, type SeatProfile } from './astronauts';

/**
 * Crews the player can choose on the home screen. All are real astronauts:
 * - Two commanders from the team briefing: Anne McClain (Option A) and Neil Armstrong (Option B).
 * - Their engineer, medic and scientist are drawn at random from astronauts.ts, never repeated
 *   between the two crews.
 * The player plays as the crew's Commander.
 *
 * A crew id lists its members ("crew-mcclain-pontes-aunon-schmitt"), so a saved game
 * can rebuild the same crew.
 */
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
}

interface Lineup {
  commander: Astronaut;
  engineer: Astronaut & { role: 'engineer' };
  medic: Astronaut & { role: 'medic' };
  scientist: Astronaut & { role: 'scientist' };
}

const ID_PREFIX = 'crew-';

function lineupId(l: Lineup): string {
  return `${ID_PREFIX}${l.commander.id}-${l.engineer.id}-${l.medic.id}-${l.scientist.id}`;
}

function buildTeam(lineup: Lineup, name: string, tagline: string): CrewTeam {
  return {
    id: lineupId(lineup),
    name,
    tagline,
    commander: toSeat(lineup.commander),
    members: {
      engineer: toCrewMember(lineup.engineer),
      medic: toCrewMember(lineup.medic),
      scientist: toCrewMember(lineup.scientist),
    },
    seats: [toSeat(lineup.engineer), toSeat(lineup.medic), toSeat(lineup.scientist)],
  };
}

/** Builds a lineup from astronaut ids; undefined if any id is unknown or in the wrong seat. */
function lineupFromIds(ids: string[]): Lineup | undefined {
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

/** The two commanders from the team briefing (Options A and B). The player picks one. */
export const COMMANDER_IDS = ['mcclain', 'armstrong'] as const;
const CREW_LABELS = ['Crew A', 'Crew B'];

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * One crew per commander. Engineer, medic and scientist are drawn at random,
 * and no astronaut appears in both crews, so the two choices always differ.
 */
export function drawTeams(random: () => number = Math.random): CrewTeam[] {
  const engineers = shuffled(astronautsFor('engineer'), random);
  const medics = shuffled(astronautsFor('medic'), random);
  const scientists = shuffled(astronautsFor('scientist'), random);

  return COMMANDER_IDS.map((commanderId, i) => {
    const lineup = lineupFromIds([commanderId, engineers[i].id, medics[i].id, scientists[i].id]);
    if (!lineup) throw new Error(`Bad crew lineup for ${commanderId}`);
    return buildTeam(lineup, CREW_LABELS[i], `Led by Commander ${lineup.commander.name}.`);
  });
}

/** Default crew for old saves: the briefing's Option A. */
const FALLBACK = lineupFromIds(['mcclain', 'pontes', 'aunon', 'schmitt']);
export const DEFAULT_TEAM_ID = 'crew-mcclain-pontes-aunon-schmitt';

/** Rebuilds any crew from its id (saved games). Unknown or old ids fall back to Option A. */
export function getTeam(id: string): CrewTeam {
  const lineup = (id.startsWith(ID_PREFIX) && lineupFromIds(id.slice(ID_PREFIX.length).split('-'))) || FALLBACK;
  if (!lineup) throw new Error('Fallback crew is invalid');
  const index = COMMANDER_IDS.indexOf(lineup.commander.id as (typeof COMMANDER_IDS)[number]);
  return buildTeam(lineup, CREW_LABELS[index] ?? 'Crew', `Led by Commander ${lineup.commander.name}.`);
}
