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
      'Your crew made it home safely with resources to spare. NASA celebrates your leadership — you kept everyone alive, healthy, and hopeful. The world watches as your capsule splashes down to cheering crowds.',
    threshold: 30,
  },
  {
    id: 'medium',
    title: 'Survived... Barely',
    description:
      'You made it back, but it was close. Resources ran dangerously low and the crew is exhausted. Some systems failed in the final days. NASA is relieved, but lessons will be learned from this mission.',
    threshold: 10,
  },
  {
    id: 'bad',
    title: 'Mission Failed',
    description:
      'Resources dropped to critical levels. Emergency protocols activated and the mission had to be cut short. The crew survived thanks to the escape pods, but the mission is considered a failure. Earth will try again someday.',
    threshold: 0,
  },
];
