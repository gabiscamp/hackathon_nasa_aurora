import type { CollapseCause } from '../stores/useMissionStore';

export interface Ending {
  id: 'good' | 'medium' | 'bad';
  title: string;
  description: string;
  threshold: number;
}

export const ENDINGS: Ending[] = [
  {
    id: 'good',
    title: 'Mission Accomplished!',
    description:
      'Congratulations, Commander {name}! Your crew made it home safely with resources to spare. NASA celebrates your leadership — you kept everyone alive, healthy, and hopeful. The data you collected will help future Mars missions. The world watches as your capsule docks to cheering crowds.',
    threshold: 30,
  },
  {
    id: 'medium',
    title: 'Survived... Barely',
    description:
      'Commander {name}, you made it back, but it was close. Resources ran dangerously low and the crew is exhausted. Some systems failed in the final days. NASA is relieved, but lessons will be learned from this mission. Try again with a different strategy?',
    threshold: 10,
  },
  {
    id: 'bad',
    title: 'A Tough Mission',
    description:
      'Commander {name}, the mission was hard and some things went wrong. Resources dropped to critical levels and emergency protocols were activated. But you learned something important: in space, every decision matters. The real astronauts know this. Try again?',
    threshold: 0,
  },
];

/** Game over (src/engine/survival.ts): the station is lost, the crew escapes safely. Gentle for ages 7-12. */
export interface CollapseEnding {
  title: string;
  /** {name} = commander, {day} = the day it happened. */
  description: string;
  /** A real story or fact about the same danger. */
  fact: string;
  /** What to do differently next time. */
  tip: string;
  /** Resources whose losses are listed under "What went wrong". */
  related: ('food' | 'water' | 'energy' | 'oxygen' | 'health' | 'radiation')[];
}

export const COLLAPSE_ENDINGS: Record<CollapseCause, CollapseEnding> = {
  oxygen: {
    title: 'Station Lost: The Air Ran Out',
    description:
      'Commander {name}, the oxygen reached 0 on Day {day}. The alarms rang, the crew put on their space suits and flew away in the escape capsule. Everyone is safe, but Aurora Station was lost.',
    fact: 'REAL STORY: On Apollo 13 (1970), an oxygen tank exploded on the way to the Moon. The crew used the small lunar module as a lifeboat and made it home safely.',
    tip: 'Never let energy reach 0: without it, the oxygen machine stops. When oxygen turns red, fix it before anything else.',
    related: ['oxygen', 'energy'],
  },
  health: {
    title: 'Station Lost: The Crew Was Too Sick',
    description:
      'Commander {name}, crew health reached 0 on Day {day}. Mission Control sent everyone home in the escape capsule to see doctors on Earth. The crew will get better, but Aurora Station was lost.',
    fact: 'REAL STORY: In 1985, cosmonaut Vladimir Vasyutin got very sick on the space station Salyut 7. The mission ended early and the crew flew home so he could be treated.',
    tip: 'Air, water and food keep the crew healthy. When one of those bars turns red, everyone loses health every day.',
    related: ['health', 'oxygen', 'water', 'food'],
  },
  radiation: {
    title: 'Station Lost: Too Much Radiation',
    description:
      'Commander {name}, radiation reached 100 on Day {day}. It was not safe to stay, so Mission Control ordered everyone into the escape capsule. The crew is safe, but Aurora Station had to be left behind.',
    fact: 'SPACE FACT: NASA has a career limit of 600 mSv of radiation, the same for every astronaut. It keeps the risk of getting very sick later in life under 3 in 100.',
    tip: 'Hide in the shelter during solar storms, build shields, and keep radiation below 70.',
    related: ['radiation'],
  },
};
