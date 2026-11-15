/**
 * Crew data model. Every crew has the same three roles below (plus the Commander,
 * who is the player), so missions can target a role no matter which crew was chosen.
 * Crew rosters live in src/data/crews.ts.
 */
export type CrewRole = 'engineer' | 'medic' | 'scientist';

export const CREW_ROLES: readonly CrewRole[] = ['engineer', 'medic', 'scientist'];

export interface CrewMember {
  /** Same as the role: missions refer to crew members by role. */
  id: CrewRole;
  role: CrewRole;
  name: string;
  roleLabel: string;
  skill: 'engineering' | 'medical' | 'science' | 'leadership';
  health: number;
  morale: number;
  color: string;
  /** Catchphrase; empty for real astronauts (we never invent quotes for real people). */
  phrase: string;
  description: string;
  /** Real specialty, for astronaut crew members. */
  specialty?: string;
  /** Team-written strengths (fiction for the game). */
  strengths?: string;
  /** Portrait URL (public/astronauts). */
  photo?: string;
  skills: { label: string; value: number }[];
}

export type CrewMemberDefinition = Omit<CrewMember, 'health' | 'morale'>;

/** Shows "Commander Ana" when the crew names its commander, otherwise just "Commander". */
export function commanderLabel(name: string | undefined): string {
  return name ? `Commander ${name}` : 'Commander';
}
