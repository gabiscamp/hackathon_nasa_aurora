import type { CrewMemberDefinition, CrewRole } from './crew';
import { ASTRONAUT_PHOTOS } from './astronautPhotos';

/**
 * Real astronauts used as crew. Two sources:
 * - Team briefing, section "X. Perfis dos Tripulantes" (Options A and B): description,
 *   skills, strengths and catchphrase written by the team. Per the briefing (X.3), the
 *   personalities, phrases and skill percentages are fiction for the game, not a rating
 *   of the real people.
 * - The team's list of 10 extra candidates: description only. They get the role's
 *   default skills (main skill 100%, others 40–60%, the briefing's rule) and no phrase,
 *   because we never invent quotes for real people.
 * Texts are shortened to simple English for kids.
 */
export type SeatRole = 'commander' | CrewRole;

/** Pixel-art heads are per crew: see HEAD_IDS and CrewTeam.heads in crews.ts. */
export interface Astronaut {
  id: string;
  name: string;
  role: SeatRole;
  specialty: string;
  description: string;
  /** Team-written strengths (fiction for the game). */
  strengths?: string;
  /** Team-written catchphrase (fiction for the game). */
  phrase?: string;
  skills?: { label: string; value: number }[];
}

export const ASTRONAUTS: readonly Astronaut[] = [
  // --- From the team briefing (Options A and B) ---
  {
    id: 'mcclain',
    name: 'Anne McClain',
    role: 'commander',
    specialty: 'Command, piloting and navigation',
    description: 'Anne is a mechanical and aerospace engineer and a military pilot. She did spacewalks and commanded the NASA SpaceX Crew-10 mission.',
    strengths: 'Brave, disciplined and observant.',
    phrase: '"Before we act, we need to understand the risks!"',
    skills: [
      { label: 'Piloting & Navigation', value: 100 },
      { label: 'Engineering', value: 60 },
      { label: 'Communication', value: 60 },
      { label: 'Emergency Medicine', value: 50 },
      { label: 'Science', value: 40 },
    ],
  },
  {
    id: 'armstrong',
    name: 'Neil Armstrong',
    role: 'commander',
    specialty: 'Command, piloting and navigation',
    description: 'Neil was an aeronautical engineer and test pilot. He commanded Apollo 11 in 1969 and was the first person to walk on the Moon.',
    strengths: 'Calm, focused and responsible.',
    phrase: '"Calm and planning take us further!"',
    skills: [
      { label: 'Piloting & Navigation', value: 100 },
      { label: 'Engineering', value: 60 },
      { label: 'Communication', value: 60 },
      { label: 'Emergency Medicine', value: 40 },
      { label: 'Science', value: 50 },
    ],
  },
  {
    id: 'aunon',
    name: 'Serena Auñón-Chancellor',
    role: 'medic',
    specialty: 'Medicine and crew health',
    description: 'Serena is a doctor and an electrical engineer. She spent 197 days on the International Space Station.',
    strengths: 'Caring, careful and patient.',
    phrase: '"Taking care of the crew is a mission too!"',
    skills: [
      { label: 'Medicine & First Aid', value: 100 },
      { label: 'Air & Water Quality', value: 60 },
      { label: 'Engineering', value: 50 },
      { label: 'Communication', value: 60 },
      { label: 'Science', value: 60 },
    ],
  },
  {
    id: 'pontes',
    name: 'Marcos Pontes',
    role: 'engineer',
    specialty: 'Engineering and systems',
    description: 'Marcos was the first Brazilian in space. He is an aeronautical engineer and test pilot, and spent 10 days on the space station in 2006.',
    strengths: 'Creative, persistent and curious.',
    phrase: '"There is always a way to solve a problem!"',
    skills: [
      { label: 'Engineering', value: 100 },
      { label: 'Life Support', value: 60 },
      { label: 'Piloting', value: 50 },
      { label: 'Science', value: 60 },
      { label: 'Emergency Medicine', value: 40 },
    ],
  },
  {
    id: 'schmitt',
    name: 'Harrison Schmitt',
    role: 'scientist',
    specialty: 'Geology and planetary science',
    description: 'Harrison is a geologist who flew on Apollo 17. He was one of the first scientists to explore the surface of the Moon.',
    strengths: 'Curious, detailed and a great investigator.',
    phrase: '"Every discovery starts with a question!"',
    skills: [
      { label: 'Planetary Science', value: 100 },
      { label: 'Data & Sensors', value: 60 },
      { label: 'Communication', value: 50 },
      { label: 'Engineering', value: 50 },
      { label: 'Emergency Medicine', value: 40 },
    ],
  },
  {
    id: 'watkins',
    name: 'Jessica Watkins',
    role: 'scientist',
    specialty: 'Geology and planetary science',
    description: 'Jessica is a geologist with a PhD. She worked with the science team of the Curiosity rover on Mars.',
    strengths: 'Curious, team player and persistent.',
    phrase: '"Let\'s find out what Mars has to tell us!"',
    skills: [
      { label: 'Planetary Science', value: 100 },
      { label: 'Data & Sensors', value: 60 },
      { label: 'Communication', value: 60 },
      { label: 'Engineering', value: 50 },
      { label: 'Emergency Medicine', value: 40 },
    ],
  },

  // --- From the team's list of 10 candidates ---
  {
    id: 'wiseman',
    name: 'Reid Wiseman',
    role: 'engineer',
    specialty: 'Systems engineering and naval aviation',
    description: 'Reid was the commander of Artemis II. He also lived on the International Space Station.',
  },
  {
    id: 'glover',
    name: 'Victor Glover',
    role: 'engineer',
    specialty: 'Engineering and test piloting',
    description: 'Victor was the pilot of Artemis II, the crewed flight around the Moon. He was a Navy aviator and test pilot.',
  },
  {
    id: 'moghbeli',
    name: 'Jasmin Moghbeli',
    role: 'engineer',
    specialty: 'Aerospace engineering and piloting',
    description: 'Jasmin is an aerospace engineer and a former Marine attack helicopter pilot. She has led risky missions on Earth and in space.',
  },
  {
    id: 'koch',
    name: 'Christina Koch',
    role: 'engineer',
    specialty: 'Electrical engineering',
    description: 'Christina spent 328 days in a row in space. She also worked in Antarctica, one of the coldest places on Earth.',
  },
  {
    id: 'rubio',
    name: 'Frank Rubio',
    role: 'medic',
    specialty: 'Medicine and military aviation',
    description: 'Frank is a doctor and a former military pilot. He spent 371 days in a row in space.',
  },
  {
    id: 'lindgren',
    name: 'Kjell Lindgren',
    role: 'medic',
    specialty: 'Medicine and space operations',
    description: 'Kjell is a doctor who worked on the International Space Station. He keeps the crew healthy.',
  },
  {
    id: 'meir',
    name: 'Jessica Meir',
    role: 'scientist',
    specialty: 'Marine biology and physiology',
    description: 'Jessica studies how living things survive in extreme places. That helps us learn how people can live on Mars.',
  },
  {
    id: 'maurer',
    name: 'Matthias Maurer',
    role: 'scientist',
    specialty: 'Materials science and exploration',
    description: 'Matthias is a German astronaut with a PhD in materials science. He trained in caves and underwater to get ready for other worlds.',
  },
];

/** Default look and skills per seat (briefing rule: main skill 100%, others 40–60%). */
export const SEAT_PROFILE: Record<SeatRole, Pick<CrewMemberDefinition, 'roleLabel' | 'skill' | 'color' | 'skills'>> = {
  commander: {
    roleLabel: 'Commander & Pilot',
    skill: 'leadership',
    color: '#4dc9f6',
    skills: [
      { label: 'Piloting & Navigation', value: 100 },
      { label: 'Engineering', value: 60 },
      { label: 'Communication', value: 60 },
      { label: 'Emergency Medicine', value: 40 },
      { label: 'Science', value: 50 },
    ],
  },
  engineer: {
    roleLabel: 'Flight Engineer',
    skill: 'engineering',
    color: '#f59e0b',
    skills: [
      { label: 'Engineering', value: 100 },
      { label: 'Life Support', value: 60 },
      { label: 'Piloting', value: 50 },
      { label: 'Science', value: 50 },
      { label: 'Emergency Medicine', value: 40 },
    ],
  },
  medic: {
    roleLabel: 'Medical Officer',
    skill: 'medical',
    color: '#10b981',
    skills: [
      { label: 'Medicine & First Aid', value: 100 },
      { label: 'Air & Water Quality', value: 60 },
      { label: 'Engineering', value: 50 },
      { label: 'Communication', value: 60 },
      { label: 'Science', value: 50 },
    ],
  },
  scientist: {
    roleLabel: 'Science Officer',
    skill: 'science',
    color: '#8b5cf6',
    skills: [
      { label: 'Planetary Science', value: 100 },
      { label: 'Data & Sensors', value: 60 },
      { label: 'Communication', value: 50 },
      { label: 'Engineering', value: 50 },
      { label: 'Emergency Medicine', value: 40 },
    ],
  },
};

export function getAstronaut(id: string): Astronaut | undefined {
  return ASTRONAUTS.find((a) => a.id === id);
}

export function astronautsFor(role: SeatRole): Astronaut[] {
  return ASTRONAUTS.filter((a) => a.role === role);
}

/** A seat on the crew card / crew intro. Commander is the player, so it is not a CrewRole. */
export interface SeatProfile extends Omit<CrewMemberDefinition, 'id' | 'role'> {
  role: SeatRole;
  astronautId: string;
}

export function toSeat(astronaut: Astronaut): SeatProfile {
  const profile = SEAT_PROFILE[astronaut.role];
  return {
    role: astronaut.role,
    astronautId: astronaut.id,
    name: astronaut.name,
    roleLabel: profile.roleLabel,
    skill: profile.skill,
    color: profile.color,
    skills: astronaut.skills ?? profile.skills,
    phrase: astronaut.phrase ?? '',
    description: astronaut.description,
    specialty: astronaut.specialty,
    strengths: astronaut.strengths,
    photo: ASTRONAUT_PHOTOS[astronaut.id]?.src,
  };
}

/** Crew store entry for one of the three non-player seats. */
export function toCrewMember(astronaut: Astronaut & { role: CrewRole }): CrewMemberDefinition {
  const { astronautId: _id, ...seat } = toSeat(astronaut);
  return { ...seat, id: astronaut.role, role: astronaut.role };
}
