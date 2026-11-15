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
    id: 'co2-filter-failure',
    title: 'CO2 Filter Failure',
    description: 'The CO2 scrubber broke! It removes carbon dioxide from the air. Without it, the crew will slowly suffocate. You have limited tools and materials.',
    act: 2,
    day: 40,
    system: 'oxygen',
    room: 'engineering',
    icon: '💨',
    nasaSource: 'Apollo 13',
    nasaYear: 1970,
    popup: 'THIS REALLY HAPPENED! On Apollo 13, the CO2 filters broke. NASA engineers on Earth had to figure out how to build an adapter from duct tape, cardboard, and plastic bags — using only what the astronauts had on board. They did it, and saved the crew.',
    choices: [
      {
        id: 'build-adapter',
        label: 'Build an adapter',
        icon: '🔧',
        effects: [
          { resource: 'oxygen', delta: -5 },
        ],
        narrative:
          'The engineer worked for 3 hours and built an adapter from tape and plastic. The filter works again! But CO2 rose during the repair.',
        successRate: 80,
        failNarrative: 'The engineer tried but the adapter didn\'t hold. CO2 is still rising. You need another plan.',
        failEffects: [{ resource: 'oxygen', delta: -15 }],
      },
      {
        id: 'everybody-rest',
        label: 'Everybody rest',
        icon: '😴',
        effects: [
          { resource: 'oxygen', delta: -3 },
          { resource: 'satisfaction', delta: -5 },
        ],
        narrative:
          'The crew lay still for hours, breathing slowly. CO2 rose slowly but stayed below danger. No work done today — the filter still needs fixing tomorrow.',
      },
      {
        id: 'use-candles',
        label: 'Use oxygen candles',
        icon: '🕯️',
        effects: [
          { resource: 'oxygen', delta: 5 },
          { resource: 'energy', delta: -3 },
        ],
        narrative:
          'You burned one precious oxygen candle. Fresh air! But candles are limited and there\'s a small fire risk. The filter still needs fixing.',
      },
    ],
  },
  {
    id: 'fire-on-station',
    title: 'Fire on the Station!',
    description: 'An oxygen candle caught fire! These candles normally make oxygen, but this one is burning out of control. Smoke is filling the room. The fire is blocking the path to one of the escape pods.',
    act: 3,
    day: 72,
    system: 'oxygen',
    room: 'engineering',
    icon: '🔥',
    nasaSource: 'MIR Space Station',
    nasaYear: 1997,
    popup: 'THIS REALLY HAPPENED! In February 1997, an oxygen candle caught fire on the MIR space station. The flames burned for 14 minutes and blocked one of the two escape capsules. The crew fought the fire with extinguishers. Nobody died, but the smoke made the air bad for weeks.',
    choices: [
      {
        id: 'fight-fire',
        label: 'Fight the fire',
        icon: '🧯',
        effects: [
          { resource: 'oxygen', delta: -8 },
          { resource: 'health', delta: -15 },
        ],
        narrative:
          'Two crew members fought the fire with extinguishers for 15 minutes. Fire is out! But toxic smoke fills the air for the next 3 days. Everyone gets headaches.',
      },
      {
        id: 'seal-room',
        label: 'Seal the room',
        icon: '🚪',
        effects: [
          { resource: 'energy', delta: -10 },
        ],
        narrative:
          'You sealed the door. No air means no fire. It died out. But everything in that room is lost — tools, spare parts, and one escape pod access.',
      },
      {
        id: 'evacuate-safe',
        label: 'Move to safe area',
        icon: '🏃',
        effects: [
          { resource: 'energy', delta: -5 },
          { resource: 'oxygen', delta: -5 },
          { resource: 'satisfaction', delta: -10 },
        ],
        narrative:
          'Everyone moved to the safe section near escape pod 2. The fire burned itself out but may have damaged equipment.',
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
    id: 'air-leak',
    title: 'Air Leak!',
    description:
      'A slow air leak has been detected on the station. Pressure is dropping. You need to find and seal the leak before the air runs out.',
    act: 1,
    day: 10,
    system: 'oxygen',
    room: 'bridge',
    icon: '💨',
    nasaSource: 'ISS',
    nasaYear: 2004,
    popup: 'THIS REALLY HAPPENED! In 2004, a slow air leak was detected on the ISS. After days of searching, they found it — a hose that astronauts had been using as a handhold had cracked a seal. Something that simple almost caused a serious emergency.',
    choices: [
      {
        id: 'lockdown-search',
        label: 'Lock down and search',
        icon: '🔒',
        effects: [
          { resource: 'oxygen', delta: -3 },
          { resource: 'satisfaction', delta: -5 },
        ],
        narrative:
          'You sealed all rooms and checked each one. Found it! A cracked hose seal. Easy fix once found. But it took a full day with everyone in tight spaces.',
      },
      {
        id: 'listen-for-it',
        label: 'Listen for the leak',
        icon: '👂',
        effects: [],
        narrative:
          'The crew spread out with leak detectors. Found it in 4 hours! Much faster. A cracked hose seal — fixed quickly.',
        successRate: 85,
        failNarrative: 'Couldn\'t find it today. Pressure dropped more. Tomorrow you\'ll have to do the full lockdown with less air.',
        failEffects: [{ resource: 'oxygen', delta: -8 }],
      },
      {
        id: 'eva-inspect',
        label: 'Inspect from outside',
        icon: '🧑‍🚀',
        effects: [
          { resource: 'oxygen', delta: -5 },
          { resource: 'energy', delta: -5 },
          { resource: 'health', delta: -5 },
        ],
        narrative:
          'The engineer went outside and found the leak AND two other weak spots. You can fix them before they become leaks too. But the engineer is exhausted.',
      },
    ],
  },
  {
    id: 'toxic-air',
    title: 'Toxic Air!',
    description: 'The oxygen machine overheated and is smoking! The air smells like burning rubber. This is the first serious emergency on the station.',
    act: 2,
    day: 35,
    system: 'oxygen',
    room: 'engineering',
    icon: '☠️',
    nasaSource: 'ISS',
    nasaYear: 2006,
    popup:
      'THIS REALLY HAPPENED! The Mars Express probe passed up to 75 minutes in Mars\'s shadow every orbit. With weak batteries and 20% less sunlight, it entered survival mode: turned off all science instruments and cut power from 400W to 300W.',
    choices: [
      {
        id: 'masks-restart',
        label: 'Masks on, restart it',
        icon: '😷',
        effects: [
          { resource: 'oxygen', delta: -5 },
        ],
        narrative:
          'Everyone put on masks. The engineer restarted the machine — it works at 70% power! Needs full repair tomorrow.',
        successRate: 60,
        failNarrative: 'The machine won\'t start. You need to use emergency oxygen candles now.',
        failEffects: [{ resource: 'oxygen', delta: -15 }],
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
  {
    id: 'debris-field',
    title: 'Debris Field!',
    description: 'An old satellite broke apart and the debris is heading toward the station. Pieces of metal moving at 7 km/s — faster than a bullet. Even a small piece can punch through the hull.',
    act: 2,
    day: 50,
    system: 'shielding',
    room: 'bridge',
    icon: '🛰️',
    nasaSource: 'ISS',
    nasaYear: 2021,
    popup: 'THIS REALLY HAPPENED! In 2021, the ISS had to dodge debris 3 times. Once, the crew had to shelter in the Soyuz capsules. In 2022, debris from a destroyed satellite came within 25 km of the station. At orbital speeds, even a paint fleck can crack a window.',
    choices: [
      {
        id: 'escape-pods',
        label: 'Everyone to escape pods',
        icon: '🚀',
        effects: [
          { resource: 'satisfaction', delta: -10 },
        ],
        narrative:
          'Everyone squeezed into the escape capsules for 2 hours. The debris passed without hitting the station. Safe, but 2 hours of work lost.',
      },
      {
        id: 'shelter-core',
        label: 'Shelter in the core',
        icon: '🛡️',
        effects: [
          { resource: 'satisfaction', delta: -5 },
        ],
        narrative:
          'The crew moved to the most shielded part of the station. The debris passed safely. Less disruptive than the pods.',
      },
      {
        id: 'dodge-station',
        label: 'Move the station',
        icon: '🎯',
        effects: [
          { resource: 'energy', delta: -8 },
        ],
        narrative:
          'The scientist calculated the perfect dodge. Thrusters fired and the station moved to a safe orbit. But fuel is limited — can\'t do this often.',
        successRate: 90,
        failNarrative: 'The dodge wasn\'t enough. A small piece clipped a solar panel.',
        failEffects: [{ resource: 'energy', delta: -15 }],
      },
    ],
  },
  {
    id: 'radio-silence',
    title: 'Radio Silence',
    description: 'You can\'t reach Earth. No messages coming in. No messages going out. You don\'t know if the problem is on your end or Earth\'s end. You are alone.',
    act: 2,
    day: 45,
    system: 'communication',
    room: 'bridge',
    icon: '📡',
    nasaSource: 'CHAPEA Mars Simulation',
    nasaYear: 2025,
    popup: 'THIS HAPPENED IN A SIMULATION! During NASA\'s CHAPEA Mars experiment, the 4-person crew went 2 full weeks without ANY communication from the outside. They had to make every decision on their own. This is what a real Mars mission would be like.',
    choices: [
      {
        id: 'stay-calm',
        label: 'Stay calm, keep routine',
        icon: '😌',
        effects: [
          { resource: 'satisfaction', delta: -5 },
        ],
        narrative:
          'You told the crew to follow the normal schedule. Communication came back in 2 days. It was just a technical glitch on Earth\'s side.',
      },
      {
        id: 'boost-antenna',
        label: 'Boost the antenna',
        icon: '📡',
        effects: [
          { resource: 'energy', delta: -8 },
          { resource: 'oxygen', delta: -3 },
        ],
        narrative:
          'You redirected power to the antenna. You reached Earth! They said it was a minor equipment problem on their end.',
        successRate: 70,
        failNarrative: 'Still no contact. You used extra energy for nothing. The crew is colder and oxygen production was slower.',
        failEffects: [
          { resource: 'energy', delta: -5 },
          { resource: 'oxygen', delta: -5 },
        ],
      },
      {
        id: 'emergency-protocol',
        label: 'Emergency protocol',
        icon: '🚨',
        effects: [
          { resource: 'energy', delta: -5 },
          { resource: 'satisfaction', delta: -15 },
        ],
        narrative:
          'You assumed the worst and prepared for an emergency. Turns out it was just a glitch. But the crew is now scared and will work slower tomorrow.',
      },
    ],
  },
];
