export interface Ending {
  id: 'good' | 'medium' | 'bad' | 'radiation';
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
  {
    id: 'radiation',
    title: 'Early Return — Radiation Limit',
    description:
      'Commander {name}, the radiation dose reached the safety limit. To protect the crew\'s long-term health, Mission Control ordered an early return. Nobody is hurt, but the mission ends early. The data you collected is still valuable — and you kept your crew safe, which is what matters most.',
    threshold: -1,
  },
];
