import type { ResourceKey } from '../stores/useResourceStore';

export interface ChoiceEffect {
  resource: ResourceKey;
  delta: number;
}

export interface Choice {
  id: string;
  label: string;
  icon: string;
  effects: ChoiceEffect[];
  narrative: string;
  successRate?: number;
  failNarrative?: string;
  failEffects?: ChoiceEffect[];
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  act: 1 | 2 | 3;
  day?: number;
  system: string;
  room: string;
  icon: string;
  nasaSource: string;
  nasaYear?: number;
  popup: string;
  choices: Choice[];
}

export const MISSIONS: Mission[] = [
  {
    id: 'despensa-missao',
    title: 'The Mission Pantry',
    description:
      'The ship is being loaded before launch. You can bring more freeze-dried food (light and lasts longer) or more ready-to-eat meals (tastier but heavier). This choice will affect the whole mission.',
    act: 1,
    day: 1,
    system: 'food',
    room: 'storage',
    icon: '🍽',
    nasaSource: 'ISS ECLSS / NASA food research',
    popup:
      'On the ISS, the kitchen heats and rehydrates food. Freeze-dried meals last about 2 years, but need water to prepare. Ready meals are tastier but take more cargo space. For a Mars mission, NASA needs food that lasts 5 years!',
    choices: [
      {
        id: 'freeze-dried',
        label: 'More freeze-dried food',
        icon: '📦',
        effects: [
          { resource: 'food', delta: 0 },
          { resource: 'water', delta: -5 },
        ],
        narrative:
          'Good choice, Commander! You loaded 100 units of freeze-dried food. It lasts longer, but every meal needs water to prepare. Water consumption will be a bit higher throughout the mission.',
      },
      {
        id: 'ready-meals',
        label: 'More ready-to-eat meals',
        icon: '🍱',
        effects: [
          { resource: 'food', delta: -20 },
          { resource: 'satisfaction', delta: 10 },
        ],
        narrative:
          'The crew cheered when they saw the ready meals! Tastier food boosts morale. But there\'s less of it — only 80 units fit in the cargo. You\'ll need to be careful with rationing later.',
      },
    ],
  },
  {
    id: 'bathroom-broke',
    title: 'The Bathroom Broke',
    description:
      'The toilet and water recycler broke down. In space, the toilet isn\'t just a toilet — it\'s a machine that also recycles water from pee and sweat. The ISS recycles 98% of all water. Without it, you lose water every time someone uses the bathroom.',
    act: 1,
    day: 5,
    system: 'water',
    room: 'engineering',
    icon: '🚽',
    nasaSource: 'ISS',
    nasaYear: 2008,
    popup:
      'THIS REALLY HAPPENED! The ISS toilet has broken multiple times. In 2008, NASA had to send repair parts on the next cargo ship. Without the toilet\'s water recycler, the station can\'t turn waste back into clean water — and that water is also used to make oxygen!',
    choices: [
      {
        id: 'full-repair',
        label: 'Engineer fixes it today',
        icon: '🔧',
        effects: [
          { resource: 'energy', delta: -5 },
        ],
        narrative:
          'Kira spent the whole day repairing the toilet system. The water recycler is back online — 98% of water is being recovered again! But nothing else got fixed today.',
      },
      {
        id: 'use-bags',
        label: 'Use emergency bags',
        icon: '🛍️',
        effects: [
          { resource: 'water', delta: -5 },
          { resource: 'satisfaction', delta: -10 },
        ],
        narrative:
          'The crew used emergency waste bags, like astronauts in the old Apollo missions. It works, but nobody is happy about it. The water in those bags can\'t be recycled — lost forever.',
      },
      {
        id: 'partial-fix',
        label: 'Quick partial fix',
        icon: '⚡',
        effects: [
          { resource: 'water', delta: -3 },
          { resource: 'energy', delta: -3 },
        ],
        narrative:
          'Kira did a quick fix — toilet works for comfort but the water recycler is still broken. Water from waste isn\'t being recycled. You\'re losing a little water every day until the full repair.',
      },
    ],
  },
  {
    id: 'shadow-coming',
    title: 'Mars Shadow Coming',
    description:
      'The station is about to pass behind Mars. The solar panels will stop making energy. The battery can\'t power everything. What do you turn off?',
    act: 1,
    day: 12,
    system: 'energy',
    room: 'bridge',
    icon: '⚡',
    nasaSource: 'ESA Mars Express',
    nasaYear: 2006,
    popup:
      'THIS REALLY HAPPENED! The Mars Express probe passed up to 75 minutes in Mars\'s shadow every orbit. With weak batteries and 20% less sunlight, it entered survival mode: turned off all science instruments and cut power from 400W to 300W.',
    choices: [
      {
        id: 'turn-off-lab',
        label: 'Turn off the laboratory',
        icon: '🔬',
        effects: [
          { resource: 'energy', delta: 10 },
        ],
        narrative:
          'You turned off the lab. Science stops for today, but the important systems keep running. The shadow will pass in a few hours.',
      },
      {
        id: 'turn-off-greenhouse',
        label: 'Turn off the greenhouse',
        icon: '🌱',
        effects: [
          { resource: 'energy', delta: 5 },
          { resource: 'food', delta: -5 },
          { resource: 'satisfaction', delta: -3 },
        ],
        narrative:
          'The greenhouse lights went dark. The plants will survive a few hours, but the next harvest will be smaller. The crew is worried about their lettuce.',
      },
      {
        id: 'lower-heating',
        label: 'Lower the heating',
        icon: '❄️',
        effects: [
          { resource: 'energy', delta: 10 },
          { resource: 'satisfaction', delta: -5 },
          { resource: 'health', delta: -3 },
        ],
        narrative:
          'It\'s getting cold in here! Mars averages -59°C, and without full heating the station cools down fast. The crew puts on extra layers but nobody sleeps well.',
      },
    ],
  },
  {
    id: 'solar-storm-small',
    title: 'Solar Storm Warning',
    description:
      'DONKI detected a solar storm heading toward Mars. It\'s small, but the crew should take shelter. Radiation is invisible energy from the Sun — too much can make astronauts sick.',
    act: 1,
    day: 15,
    system: 'radiation',
    room: 'bridge',
    icon: '☢️',
    nasaSource: 'NASA DONKI',
    nasaYear: 2026,
    popup:
      'The DONKI system (Database Of Notifications, Knowledge, Information) tracks real solar storms. CMEs (Coronal Mass Ejections) take 4-7 days to reach Mars from the Sun. On Mars\'s surface, radiation is about 0.64 mSv per day — that\'s like getting a chest X-ray every 2 days!',
    choices: [
      {
        id: 'full-shelter',
        label: 'Everyone to the shelter',
        icon: '🛡️',
        effects: [
          { resource: 'radiation', delta: 2 },
        ],
        narrative:
          'Everyone moved to the radiation shelter. The water tanks and food bags around the walls block most of the radiation. Safe! But 2 hours of work lost while waiting for the storm to pass.',
      },
      {
        id: 'keep-working',
        label: 'Keep working',
        icon: '💪',
        effects: [
          { resource: 'radiation', delta: 8 },
        ],
        narrative:
          'The crew kept working through the storm. More got done today, but everyone absorbed extra radiation. Maya warns that radiation adds up over time — it never goes away.',
      },
    ],
  },
];
