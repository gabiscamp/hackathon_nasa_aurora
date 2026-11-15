import type { ResourceKey } from '../stores/useResourceStore';
import { MISSIONS_BATCH_1 } from './missionsBatch1';

export type MissionSeverity = 'normal' | 'critical';

export interface ChoiceEffect {
  resource: ResourceKey;
  delta: number;
}

/** The four people on board who can be sent to a job. The commander is the player. */
export type CrewSlot = 'commander' | 'engineer' | 'medic' | 'scientist';

/** Who a choice needs. Every mission needs at least one person (see DEFAULT_CREW_NEED). */
export interface CrewNeed {
  /** People needed. 0 only for missions where someone is already involved (crewOutside). */
  min: number;
  /** Most people that help (default: min). */
  max?: number;
  /** Specialists who make it easier (+15% chance, or shown as "Best: …" when there is no risk). */
  best?: CrewSlot[];
  /** Can be tried with fewer people than `min`: harder (-20% chance per missing person). */
  allowFewer?: boolean;
  /** The whole crew takes part (evacuation, everybody rests). Busy jobs are stopped. */
  everyone?: boolean;
}

/** A mission that this choice can set off later (a chained consequence). */
export interface FollowUp {
  /** Must be the id of a mission in MISSIONS (checked by validateMissions). */
  missionId: string;
  /** Days from now; 0 = a new emergency later today. */
  afterDays: number;
  /** When set, the day is random between afterDays and afterDaysMax. */
  afterDaysMax?: number;
  /** Chance in % (default 100). Rolled when it is scheduled. */
  chance?: number;
  /** Does not happen if this flag is set by the time it is due (e.g. the problem was fixed for good). */
  unlessFlag?: string;
}

/** A lasting state of the station (a temporary fix, smoke, a broken machine). Uses only the 7 resources. */
export interface StationCondition {
  id: string;
  /** Shown in the day summary, e.g. "Water recycler broken". */
  label: string;
  /** Resource change applied every day while it lasts. */
  daily: ChoiceEffect[];
  /** Lasts this many days; undefined = until a choice clears it. */
  days?: number;
  /** Makes every job harder while it lasts (in %). */
  successPenalty?: number;
}

/** What else a choice does, besides changing resources. */
export interface Outcome {
  followUps?: FollowUp[];
  addConditions?: StationCondition[];
  clearConditions?: string[];
  setFlags?: string[];
  clearFlags?: string[];
  /** Change to the oxygen-candle stock (an item, not a resource). */
  candles?: number;
  /** Personal health change for each crew member sent. */
  crewHealth?: number;
  /** Extra tiredness for each crew member sent. */
  crewFatigue?: number;
  /** The crew sent must rest this many days after (they can't be sent). */
  crewRestDays?: number;
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

  /** Who this choice needs (default: DEFAULT_CREW_NEED). */
  crew?: CrewNeed;
  /** How long the job takes, as the player reads it ("3 hours", "2 days"). */
  time?: string;
  /** Extra days the crew stays busy after today (0 or undefined = today only). */
  busyDays?: number;
  /** Tiredness added to each crew member sent (default 1). */
  fatigue?: number;
  /** An improvised fix: works now, may fail later. Shown as "Temporary fix". */
  temporary?: boolean;
  /** Oxygen candles this choice burns; locked when there are not enough. */
  needsCandles?: number;
  /** Not offered when this flag is set. */
  hiddenIfFlag?: string;
  /** If it fails, the mission comes back at once without this choice. */
  retryOnFail?: boolean;
  onSuccess?: Outcome;
  onFail?: Outcome;
  /** Applied when a multi-day job ends normally (e.g. the repair is finished). */
  onDone?: Outcome;
  /** If the crew is pulled off this job before it ends. */
  onInterrupt?: { effects: ChoiceEffect[]; text: string; resumeMissionId?: string };
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
  severity: MissionSeverity;
  nasaSource: string;
  nasaYear?: number;
  popup: string;
  choices: Choice[];

  /** Only happens when another mission sets it off (never on a fixed day). */
  followUpOnly?: boolean;
  /** "Deal with it tomorrow": what waiting costs. false = there is no time to wait. */
  defer?: { effects: ChoiceEffect[]; text: string } | false;
  /** Someone is already outside on a spacewalk and takes part in every choice. */
  crewOutside?: boolean;
  /** Popup badge: real history, a NASA simulation, or a space tip (for follow-ups). */
  factKind?: 'history' | 'simulation' | 'tip';
  /** Number of the mission in the team's missoes.txt. */
  sourceNumber?: number;
}

/** Missions written before crew assignment existed need one person, two at most. */
export const DEFAULT_CREW_NEED: CrewNeed = { min: 1, max: 2 };

export const MISSIONS_BASE: Mission[] = [
  // ═══════════════════════════════════════════════════════════════
  // ACT 1 — Days 1-15 — Easy, learning
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'mission-pantry',
    title: 'The Mission Pantry',
    description:
      'The ship is being loaded before launch. You can bring more freeze-dried food or more ready-to-eat meals. This choice will affect the whole mission.',
    act: 1,
    day: 1,
    system: 'food',
    room: 'storage',
    icon: '🍽',
    severity: 'normal',
    nasaSource: 'ISS ECLSS / NASA food research',
    popup:
      'On the ISS, freeze-dried meals last about 2 years but need water to prepare. Ready meals are tastier but take more cargo space. For a Mars mission, NASA needs food that lasts 5 years!',
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
          'Good choice, Commander! You loaded freeze-dried food. It lasts longer, but every meal needs water to prepare. Water consumption will be a bit higher.',
      },
      {
        id: 'ready-meals',
        label: 'More ready-to-eat meals',
        icon: '🍱',
        effects: [
          { resource: 'food', delta: -10 },
          { resource: 'satisfaction', delta: 10 },
        ],
        narrative:
          'The crew cheered when they saw the ready meals! Tastier food boosts morale. But there\'s less of it — you\'ll need to be careful with rationing later.',
      },
    ],
  },


  {
    id: 'bath-day',
    title: 'Bath Day',
    description:
      'It\'s been a week and the crew wants to clean up. But water is precious in space. A full shower uses a lot of water. Wet wipes use almost none.',
    act: 1,
    day: 4,
    system: 'water',
    room: 'quarters',
    icon: '🚿',
    severity: 'normal',
    nasaSource: 'ISS Hygiene Procedures',
    popup:
      'On the ISS, astronauts don\'t take showers — there are none! They use wet towels and no-rinse shampoo. Water floats in space, so a shower would be a floating blob of water. Each astronaut gets about 4 liters of water per day for everything.',
    choices: [
      {
        id: 'full-shower',
        label: 'Let everyone have a quick shower',
        icon: '🚿',
        effects: [
          { resource: 'water', delta: -8 },
          { resource: 'satisfaction', delta: 10 },
        ],
        narrative:
          'The crew feels amazing! A real shower after a week. Morale is high. But the water tanks dropped noticeably.',
      },
      {
        id: 'wet-wipes',
        label: 'Wet wipes only',
        icon: '🧻',
        effects: [
          { resource: 'water', delta: -1 },
          { resource: 'satisfaction', delta: -3 },
        ],
        narrative:
          'The crew cleaned up with wet wipes. Not great, but water is saved. A few grumbles but everyone understands.',
      },
      {
        id: 'half-and-half',
        label: 'Showers for some, wipes for others',
        icon: '🎲',
        effects: [
          { resource: 'water', delta: -4 },
          { resource: 'satisfaction', delta: 3 },
        ],
        narrative:
          'Two crew members got showers, two used wipes. Fair? Not really. But it saved some water while keeping spirits okay.',
      },
    ],
  },


  {
    id: 'mars-shadow',
    title: 'Mars Shadow',
    description:
      'The station is about to pass behind Mars. Solar panels will stop making energy. The battery can\'t power everything. What do you turn off?',
    act: 1,
    day: 6,
    system: 'energy',
    room: 'bridge',
    icon: '⚡',
    severity: 'normal',
    nasaSource: 'ESA Mars Express',
    nasaYear: 2006,
    popup:
      'The Mars Express probe passed up to 75 minutes in Mars\'s shadow every orbit. With weak batteries and 20% less sunlight than Earth, it entered survival mode — all science instruments off, power cut from 400W to 300W.',
    choices: [
      {
        id: 'turn-off-lab',
        label: 'Turn off the laboratory',
        icon: '🔬',
        effects: [{ resource: 'energy', delta: 8 }],
        narrative:
          'You turned off the lab. Science stops for today, but important systems keep running. The shadow will pass in a few hours.',
      },
      {
        id: 'turn-off-greenhouse',
        label: 'Turn off the greenhouse lights',
        icon: '🌱',
        effects: [
          { resource: 'energy', delta: 5 },
          { resource: 'food', delta: -3 },
        ],
        narrative:
          'The greenhouse lights went dark. The plants will survive, but the next harvest will be a bit smaller.',
      },
      {
        id: 'lower-heating',
        label: 'Lower the heating',
        icon: '❄️',
        effects: [
          { resource: 'energy', delta: 8 },
          { resource: 'satisfaction', delta: -5 },
          { resource: 'health', delta: -2 },
        ],
        narrative:
          'It\'s getting cold! Mars averages -59°C and without full heating the station cools fast. Everyone puts on extra layers.',
      },
    ],
  },

  {
    id: 'small-solar-storm',
    title: 'Small Solar Storm',
    description:
      'DONKI detected a solar storm heading toward Mars! It\'s small, but radiation is invisible energy from the Sun — too much can make astronauts sick.',
    act: 1,
    day: 8,
    system: 'radiation',
    room: 'bridge',
    icon: '☢️',
    severity: 'critical',
    nasaSource: 'NASA DONKI (Database Of Notifications, Knowledge, Information)',
    nasaYear: 2026,
    popup:
      'The DONKI system tracks real solar storms. CMEs (Coronal Mass Ejections) take 4-7 days to reach Mars. On Mars, radiation is about 0.64 mSv per day — like getting a chest X-ray every 2 days!',
    choices: [
      {
        id: 'full-shelter',
        label: 'Everyone to the shelter now',
        icon: '🛡️',
        effects: [{ resource: 'radiation', delta: 2 }],
        narrative:
          'Everyone moved to the radiation shelter. The water tanks around the walls block most radiation. Safe! But 2 hours of work lost.',
      },
      {
        id: 'keep-working',
        label: 'Keep working with extra shielding',
        icon: '💪',
        effects: [{ resource: 'radiation', delta: 6 }],
        narrative:
          'The crew kept working. More got done, but everyone absorbed extra radiation. Maya warns that radiation adds up — it never goes away.',
      },
    ],
  },

  {
    id: 'family-message',
    title: 'Family Message',
    description:
      'A video message arrived from the crew\'s families on Earth! But the antenna needs extra energy to download it. Do you use the energy?',
    act: 1,
    day: 9,
    system: 'energy',
    room: 'common',
    icon: '💌',
    severity: 'normal',
    nasaSource: 'ISS Communication System',
    popup:
      'On the ISS, astronauts can video-call their families. But on a Mars mission, messages take 4-24 minutes to travel one way. No live calls — only video messages, like very slow email.',
    choices: [
      {
        id: 'download-now',
        label: 'Download the message right away',
        icon: '📩',
        effects: [
          { resource: 'energy', delta: -5 },
          { resource: 'satisfaction', delta: 12 },
        ],
        narrative:
          'The crew gathered to watch. Tears and laughs! Seeing their families made everyone feel closer to home. Morale went way up.',
      },
      {
        id: 'wait-for-shadow',
        label: 'Wait until we have spare energy',
        icon: '⏰',
        effects: [{ resource: 'satisfaction', delta: -5 }],
        narrative:
          'You told the crew to wait. They understand, but they\'re disappointed. The message will be there tomorrow when energy is better.',
      },
    ],
  },


  {
    id: 'first-harvest',
    title: 'First Harvest',
    description:
      'The greenhouse lettuce is ready! Fresh food in space is rare and precious. But do you eat it now or save it for when food runs low?',
    act: 1,
    day: 12,
    system: 'food',
    room: 'lab',
    icon: '🥬',
    severity: 'normal',
    nasaSource: 'NASA Veggie Experiment',
    nasaYear: 2015,
    popup:
      'In 2015, ISS astronauts ate space-grown lettuce for the first time! The Veggie experiment grew red romaine lettuce under LED lights. Astronaut Scott Kelly said it tasted "awesome." Fresh food also gives vitamins that packaged food loses over time.',
    choices: [
      {
        id: 'eat-now',
        label: 'Fresh salad for everyone tonight',
        icon: '🥗',
        effects: [
          { resource: 'food', delta: 5 },
          { resource: 'satisfaction', delta: 8 },
          { resource: 'health', delta: 3 },
        ],
        narrative:
          'The crew had their first fresh meal in space! The lettuce was crunchy and green. Everyone felt healthier and happier.',
      },
      {
        id: 'save-it',
        label: 'Store it for later',
        icon: '📦',
        effects: [
          { resource: 'food', delta: 8 },
          { resource: 'satisfaction', delta: -2 },
        ],
        narrative:
          'You stored the lettuce for later. Smart planning! But the crew was hoping for fresh food today.',
      },
      {
        id: 'replant-half',
        label: 'Eat half, replant the other half',
        icon: '🌱',
        effects: [
          { resource: 'food', delta: 3 },
          { resource: 'satisfaction', delta: 5 },
          { resource: 'health', delta: 2 },
        ],
        narrative:
          'You ate some and replanted the roots. Small salad tonight, bigger harvest next time. The crew liked the balance.',
      },
    ],
  },

  {
    id: 'food-old-or-new',
    title: 'Food Old or New',
    description:
      'Some food packages are close to their expiration date. The vitamins inside break down over time. Do you eat the old food first or save it?',
    act: 1,
    day: 13,
    system: 'food',
    room: 'storage',
    icon: '📅',
    severity: 'normal',
    nasaSource: 'NASA Food Technology',
    popup:
      'NASA found that after 2 years, vitamins in space food drop by 30-50%. Vitamin C is the worst — it can lose 75% in 3 years. That\'s why growing fresh food on a Mars mission is so important.',
    choices: [
      {
        id: 'eat-old-first',
        label: 'Eat the older food first',
        icon: '📦',
        effects: [
          { resource: 'food', delta: -2 },
          { resource: 'health', delta: -3 },
        ],
        narrative:
          'You ate the older food. It tasted fine but had fewer vitamins. Maya noted the crew\'s nutrition levels are a bit lower.',
      },
      {
        id: 'mix-old-new',
        label: 'Mix old and new together',
        icon: '🔀',
        effects: [
          { resource: 'food', delta: -1 },
          { resource: 'health', delta: -1 },
        ],
        narrative:
          'You mixed old and new food in every meal. Balanced approach! Nutrition isn\'t perfect but nothing goes to waste.',
      },
      {
        id: 'throw-out-old',
        label: 'Get rid of the expired food',
        icon: '🗑️',
        effects: [
          { resource: 'food', delta: -8 },
          { resource: 'health', delta: 3 },
        ],
        narrative:
          'You threw out the old food. The crew gets better nutrition, but you just lost a chunk of your food supply.',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ACT 2 — Days 26-65 — Hard, cascading crises
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'debris-storm',
    title: 'Debris Storm!',
    description:
      'An old satellite broke apart and over 1500 pieces of debris are heading your way. Metal moving at 7 km/s — faster than a bullet!',
    act: 2,
    day: 14,
    system: 'shielding',
    room: 'bridge',
    icon: '🛰️',
    severity: 'critical',
    nasaSource: 'ISS Debris Avoidance',
    nasaYear: 2021,
    popup:
      'In 2021, the ISS had to dodge debris 3 times. Once, the crew sheltered in Soyuz capsules. At orbital speeds, even a paint fleck can crack a window. NASA tracks over 27,000 pieces of space junk.',
    choices: [
      {
        id: 'escape-pods',
        label: 'Everyone to escape pods',
        icon: '🚀',
        effects: [{ resource: 'satisfaction', delta: -8 }],
        narrative:
          'Everyone squeezed into the escape capsules for 2 hours. The debris passed without hitting the station. Safe!',
      },
      {
        id: 'dodge-station',
        label: 'Fire thrusters to dodge',
        icon: '🎯',
        effects: [{ resource: 'energy', delta: -8 }],
        narrative:
          'The pilot calculated a perfect dodge. Thrusters fired and the station moved to safety. But fuel is limited.',
        successRate: 85,
        failNarrative:
          'The dodge wasn\'t enough. A small piece clipped a solar panel!',
        failEffects: [{ resource: 'energy', delta: -15 }],
      },
      {
        id: 'shelter-core',
        label: 'Shelter in the most protected room',
        icon: '🛡️',
        effects: [{ resource: 'satisfaction', delta: -5 }],
        narrative:
          'The crew moved to the most shielded section. The debris passed safely. Less disruptive than the pods.',
      },
    ],
  },

  {
    id: 'big-solar-storm',
    title: 'BIG Solar Storm!',
    description:
      'A massive solar storm hit the station! Solar panels are damaged — energy production is down. The crew needs to survive with less power.',
    act: 2,
    day: 16,
    system: 'energy',
    room: 'bridge',
    icon: '🌞',
    severity: 'critical',
    nasaSource: 'NASA Solar Dynamics Observatory',
    nasaYear: 2003,
    popup:
      'In 2003, a series of solar storms (the "Halloween Storms") were so powerful they damaged satellites and caused blackouts on Earth. On Mars, without Earth\'s magnetic field, a big storm could fry electronics and give astronauts dangerous radiation doses.',
    choices: [
      {
        id: 'emergency-mode',
        label: 'Switch to emergency power mode',
        icon: '🔋',
        effects: [
          { resource: 'energy', delta: -15 },
          { resource: 'radiation', delta: 5 },
          { resource: 'satisfaction', delta: -8 },
        ],
        narrative:
          'You cut power to almost everything. Lights are dim, heating is low, no science. But you\'ll survive until panels can be repaired.',
      },
      {
        id: 'repair-panels',
        label: 'Send someone to repair the panels',
        icon: '🔧',
        effects: [
          { resource: 'energy', delta: -8 },
          { resource: 'radiation', delta: 10 },
          { resource: 'health', delta: -5 },
        ],
        narrative:
          'The engineer went outside during the storm to fix the panels. Brave! Panels are partly working again. But the engineer absorbed a lot of radiation.',
        successRate: 70,
        failNarrative:
          'The storm was too strong. The engineer had to come back without fixing the panels, and absorbed dangerous radiation.',
        failEffects: [
          { resource: 'energy', delta: -15 },
          { resource: 'radiation', delta: 15 },
          { resource: 'health', delta: -10 },
        ],
      },
      {
        id: 'shelter-wait',
        label: 'Shelter and wait for the storm to pass',
        icon: '🛡️',
        effects: [
          { resource: 'energy', delta: -12 },
          { resource: 'radiation', delta: 3 },
        ],
        narrative:
          'Everyone stayed in the shelter. The storm passed after 6 hours. Panels are damaged but working at reduced power. You\'ll need to manage carefully.',
      },
    ],
  },


  {
    id: 'crew-not-sleeping',
    title: 'Crew Not Sleeping Well',
    description:
      'The crew has been having trouble sleeping. In space, there\'s no sunrise or sunset. The body gets confused. Tired astronauts make more mistakes.',
    act: 2,
    day: 19,
    system: 'health',
    room: 'quarters',
    icon: '😴',
    severity: 'normal',
    nasaSource: 'NASA Sleep Studies on ISS',
    popup:
      'On the ISS, astronauts see 16 sunrises and sunsets every day! This confuses the body\'s sleep clock. NASA uses special blue LED lights to help astronauts feel awake, and dims them to orange at "night." Most astronauts still only sleep about 6 hours.',
    choices: [
      {
        id: 'strict-schedule',
        label: 'Set a strict sleep schedule',
        icon: '⏰',
        effects: [
          { resource: 'health', delta: 5 },
          { resource: 'satisfaction', delta: -3 },
        ],
        narrative:
          'You enforced lights-out at the same time every day. The crew grumbled at first, but after a few days they started sleeping better.',
      },
      {
        id: 'sleep-aids',
        label: 'Use sleep aids from medical bay',
        icon: '💊',
        effects: [
          { resource: 'health', delta: 3 },
          { resource: 'satisfaction', delta: 3 },
        ],
        narrative:
          'Maya gave everyone a mild sleep aid. They slept great! But the medical supplies are limited — can\'t do this every night.',
      },
      {
        id: 'relaxation-time',
        label: 'Give the crew extra free time before bed',
        icon: '🎮',
        effects: [
          { resource: 'satisfaction', delta: 8 },
          { resource: 'health', delta: 2 },
        ],
        narrative:
          'Extra free time helped the crew relax. Some read, some watched movies, some exercised. Sleep improved a little.',
      },
    ],
  },


  {
    id: 'trash-piling-up',
    title: 'Trash Piling Up',
    description:
      'There\'s nowhere to throw trash in space. Bags of garbage are piling up. The smell is getting bad and it\'s taking up space the crew needs.',
    act: 2,
    day: 21,
    system: 'health',
    room: 'storage',
    icon: '🗑️',
    severity: 'normal',
    nasaSource: 'ISS Waste Management',
    popup:
      'On the ISS, trash is packed into empty cargo ships that burn up in the atmosphere. On a Mars mission, there\'s no cargo ship — you\'re stuck with your trash! NASA is researching ways to turn trash into useful things like radiation shielding.',
    choices: [
      {
        id: 'compact-store',
        label: 'Compact it and store it tightly',
        icon: '📦',
        effects: [
          { resource: 'satisfaction', delta: -5 },
          { resource: 'health', delta: -2 },
        ],
        narrative:
          'You crushed the trash into tight cubes. It takes less space but the smell lingers. The crew is not happy about living near garbage.',
      },
      {
        id: 'airlock-dump',
        label: 'Dump it out the airlock',
        icon: '🚀',
        effects: [
          { resource: 'oxygen', delta: -3 },
          { resource: 'satisfaction', delta: 5 },
        ],
        narrative:
          'You vented the trash into space. Clean station! But you lost a bit of air each time the airlock opened, and now there\'s more space junk.',
      },
      {
        id: 'recycle-what-you-can',
        label: 'Sort and recycle what you can',
        icon: '♻️',
        effects: [
          { resource: 'energy', delta: -3 },
          { resource: 'satisfaction', delta: 3 },
        ],
        narrative:
          'The crew spent a day sorting trash. Some plastics were melted for 3D printing, food waste went to compost for the greenhouse. Good work!',
      },
    ],
  },

  {
    id: 'radio-silence',
    title: 'Radio Silence',
    description:
      'You can\'t reach Earth. No messages in, no messages out. You don\'t know if the problem is on your end or Earth\'s. You are alone.',
    act: 2,
    day: 23,
    system: 'communication',
    room: 'bridge',
    icon: '📡',
    severity: 'critical',
    nasaSource: 'NASA CHAPEA Mars Simulation',
    nasaYear: 2025,
    popup:
      'During NASA\'s CHAPEA Mars experiment, the 4-person crew went 2 full weeks without ANY communication from outside. They had to make every decision alone. This is what a real Mars mission would be like.',
    choices: [
      {
        id: 'stay-calm',
        label: 'Stay calm and keep the routine',
        icon: '😌',
        effects: [{ resource: 'satisfaction', delta: -5 }],
        narrative:
          'You told the crew to follow the normal schedule. Communication came back in 2 days — just a glitch on Earth\'s side.',
      },
      {
        id: 'boost-antenna',
        label: 'Redirect power to the antenna',
        icon: '📡',
        effects: [
          { resource: 'energy', delta: -8 },
          { resource: 'satisfaction', delta: 3 },
        ],
        narrative:
          'You boosted the signal. Got through! Earth says it was a minor equipment problem on their end.',
        successRate: 70,
        failNarrative:
          'Still no contact. You used extra energy for nothing. The crew is worried.',
        failEffects: [
          { resource: 'energy', delta: -8 },
          { resource: 'satisfaction', delta: -10 },
        ],
      },
      {
        id: 'emergency-protocol',
        label: 'Activate emergency procedures',
        icon: '🚨',
        effects: [
          { resource: 'energy', delta: -5 },
          { resource: 'satisfaction', delta: -12 },
        ],
        narrative:
          'You assumed the worst and prepared for emergency. It was just a glitch. But the crew is now nervous.',
      },
    ],
  },

  {
    id: 'crew-fight',
    title: 'Crew Fight',
    description:
      'Two crew members got into a big argument. Living in a tiny space for weeks is hard. The tension is affecting everyone on the station.',
    act: 2,
    day: 24,
    system: 'morale',
    room: 'common',
    icon: '😤',
    severity: 'normal',
    nasaSource: 'NASA Behavioral Health Research',
    popup:
      'NASA studies show that crew conflicts are one of the biggest risks on long missions. On the Russian MIR station, two cosmonauts once refused to speak to each other for weeks. NASA now trains astronauts in conflict resolution before every mission.',
    choices: [
      {
        id: 'mediate',
        label: 'Sit them down and talk it out',
        icon: '🤝',
        effects: [{ resource: 'satisfaction', delta: 5 }],
        narrative:
          'You listened to both sides and helped them find a compromise. The air cleared. They shook hands and got back to work.',
      },
      {
        id: 'separate-them',
        label: 'Give them different work areas',
        icon: '↔️',
        effects: [
          { resource: 'satisfaction', delta: -3 },
          { resource: 'energy', delta: -2 },
        ],
        narrative:
          'You put them in different parts of the station. The fighting stopped but the tension is still there. Less efficient with the team split.',
      },
      {
        id: 'day-off',
        label: 'Give everyone a rest day',
        icon: '🎮',
        effects: [
          { resource: 'satisfaction', delta: 8 },
          { resource: 'energy', delta: -3 },
        ],
        narrative:
          'You called a rest day. Everyone watched a movie together and played games. By evening, the fight was forgotten.',
      },
    ],
  },

  {
    id: 'morale-at-limit',
    title: 'Morale at the Limit',
    description:
      'The crew is exhausted and homesick. Day after day in a metal box, far from Earth. Some crew members just sit and stare at the wall.',
    act: 2,
    day: 25,
    system: 'morale',
    room: 'common',
    icon: '😞',
    severity: 'normal',
    nasaSource: 'Antarctic Station Research / ISS Psychology',
    popup:
      'Scientists at Antarctic research stations (the closest thing to Mars on Earth) call it the "Third Quarter Effect" — morale drops the most when the mission is past halfway. NASA psychologists send surprise care packages and schedule special events to help.',
    choices: [
      {
        id: 'movie-night',
        label: 'Organize a special movie night',
        icon: '🎬',
        effects: [
          { resource: 'satisfaction', delta: 10 },
          { resource: 'energy', delta: -2 },
        ],
        narrative:
          'You set up a projector and made popcorn from the greenhouse corn. The crew laughed and relaxed for the first time in days.',
      },
      {
        id: 'window-time',
        label: 'Schedule time at the observation window',
        icon: '🪟',
        effects: [
          { resource: 'satisfaction', delta: 8 },
        ],
        narrative:
          'Watching Mars rotate below is breathtaking. The crew remembered why they came. "We\'re the first humans to see this," someone whispered.',
      },
      {
        id: 'tough-talk',
        label: 'Give an honest talk about the mission',
        icon: '🎤',
        effects: [
          { resource: 'satisfaction', delta: 3 },
          { resource: 'health', delta: 2 },
        ],
        narrative:
          'You gathered the crew and spoke honestly. "It\'s hard. But we\'re doing something no one has ever done." The crew nodded and stood a little taller.',
      },
    ],
  },

  {
    id: 'outside-repair',
    title: 'Outside Repair Needed',
    description:
      'A sensor on the outside of the station is broken. Without it, you can\'t detect debris or storms. Someone needs to go outside to fix it.',
    act: 2,
    day: 27,
    system: 'shielding',
    room: 'engineering',
    icon: '🧑‍🚀',
    severity: 'critical',
    nasaSource: 'ISS Spacewalks (EVA)',
    popup:
      'Spacewalks (EVAs) are dangerous. Astronauts train underwater for years. A suit leak, a tool drifting away, or getting tangled in cables could be deadly. The ISS has done over 260 spacewalks since 1998.',
    choices: [
      {
        id: 'full-eva',
        label: 'Do a proper spacewalk to fix it',
        icon: '🧑‍🚀',
        effects: [
          { resource: 'oxygen', delta: -5 },
          { resource: 'energy', delta: -5 },
          { resource: 'health', delta: -3 },
        ],
        narrative:
          'The engineer went out, replaced the sensor, and came back safely. It took 4 hours. The engineer is exhausted but the sensor works perfectly.',
      },
      {
        id: 'robot-arm',
        label: 'Use the robot arm from inside',
        icon: '🦾',
        effects: [
          { resource: 'energy', delta: -8 },
        ],
        narrative:
          'The pilot controlled the robot arm. It was tricky, but the sensor got replaced without anyone going outside. Slower but safer.',
        successRate: 65,
        failNarrative:
          'The robot arm couldn\'t reach the right angle. Someone will have to go outside after all.',
        failEffects: [
          { resource: 'energy', delta: -5 },
          { resource: 'oxygen', delta: -5 },
          { resource: 'health', delta: -3 },
        ],
      },
      {
        id: 'work-without',
        label: 'Work without the sensor for now',
        icon: '🙈',
        effects: [
          { resource: 'satisfaction', delta: -5 },
        ],
        narrative:
          'No repair needed today, but you\'re flying blind. If debris or a storm comes, you might not see it in time.',
      },
    ],
  },


  {
    id: 'birthday-on-station',
    title: 'Birthday on the Station!',
    description:
      'It\'s a crew member\'s birthday! How do you celebrate when you\'re millions of kilometers from home?',
    act: 2,
    day: 29,
    system: 'morale',
    room: 'common',
    icon: '🎂',
    severity: 'normal',
    nasaSource: 'ISS Birthday Traditions',
    popup:
      'Astronaut Scott Kelly celebrated two birthdays on the ISS during his year in space. NASA sent a special tortilla "cake" and the crew sang Happy Birthday in zero gravity. Birthday cards from family were emailed up.',
    choices: [
      {
        id: 'full-party',
        label: 'Throw a full party with extra food',
        icon: '🎉',
        effects: [
          { resource: 'food', delta: -5 },
          { resource: 'satisfaction', delta: 15 },
          { resource: 'energy', delta: -2 },
        ],
        narrative:
          'The crew made a tortilla cake, decorated the common room, and took the day easy. Best day on the station so far!',
      },
      {
        id: 'small-celebration',
        label: 'A small celebration after work',
        icon: '🎈',
        effects: [
          { resource: 'food', delta: -2 },
          { resource: 'satisfaction', delta: 8 },
        ],
        narrative:
          'After a normal work day, you had a small dessert and sang Happy Birthday. Simple but meaningful.',
      },
      {
        id: 'normal-day',
        label: 'Sorry, we need to keep working',
        icon: '📋',
        effects: [
          { resource: 'satisfaction', delta: -8 },
        ],
        narrative:
          'You kept the normal schedule. The birthday person said they understood, but they looked disappointed. The rest of the crew was quiet.',
      },
    ],
  },

  {
    id: 'food-running-low',
    title: 'Food Running Low',
    description:
      'You counted the food supply. There\'s enough to last, but only if you eat smaller portions. The crew is already hungry from hard work.',
    act: 2,
    day: 30,
    system: 'food',
    room: 'storage',
    icon: '🍽',
    severity: 'normal',
    nasaSource: 'NASA Mars Mission Planning',
    popup:
      'NASA plans for each astronaut to eat about 2,500 calories per day. But in space, astronauts often lose their appetite and eat less. On a Mars mission, food resupply is impossible — what you bring is all you get.',
    choices: [
      {
        id: 'ration-equally',
        label: 'Everyone eats the same smaller amount',
        icon: '⚖️',
        effects: [
          { resource: 'food', delta: 3 },
          { resource: 'satisfaction', delta: -8 },
          { resource: 'health', delta: -3 },
        ],
        narrative:
          'Everyone gets the same smaller portions. Fair, but the crew is hungry. Less energy for work. Food will last longer though.',
      },
      {
        id: 'greenhouse-boost',
        label: 'Push the greenhouse to grow more',
        icon: '🌱',
        effects: [
          { resource: 'food', delta: 5 },
          { resource: 'energy', delta: -5 },
          { resource: 'water', delta: -3 },
        ],
        narrative:
          'You boosted the greenhouse lights and watering. More food coming, but it costs energy and water. The next harvest should help.',
      },
      {
        id: 'skip-meals',
        label: 'Skip one meal a day',
        icon: '⏭️',
        effects: [
          { resource: 'food', delta: 5 },
          { resource: 'health', delta: -5 },
          { resource: 'satisfaction', delta: -10 },
        ],
        narrative:
          'The crew skips lunch. Food lasts longer, but everyone is weaker and grumpy. Mistakes start happening.',
      },
    ],
  },

  {
    id: 'water-rationing',
    title: 'Water Rationing',
    description:
      'Water reserves are getting low. The recycler can\'t keep up. You need to decide how to cut water use.',
    act: 2,
    day: 31,
    system: 'water',
    room: 'bridge',
    icon: '💧',
    severity: 'normal',
    nasaSource: 'ISS ECLSS Water Budget',
    popup:
      'Each person on the ISS uses about 3.6 liters of water per day for drinking and food. The recycler recovers 98%, but that 2% loss adds up over months. On a Mars mission, every drop counts.',
    choices: [
      {
        id: 'strict-rations',
        label: 'Strict water limits for everyone',
        icon: '📏',
        effects: [
          { resource: 'water', delta: 5 },
          { resource: 'satisfaction', delta: -8 },
          { resource: 'health', delta: -3 },
        ],
        narrative:
          'Everyone gets exactly 2 liters per day. Enough to survive, but not comfortable. Dehydration headaches start.',
      },
      {
        id: 'cut-non-essential',
        label: 'Cut water to non-essential systems',
        icon: '🔌',
        effects: [
          { resource: 'water', delta: 3 },
          { resource: 'food', delta: -3 },
          { resource: 'satisfaction', delta: -3 },
        ],
        narrative:
          'Greenhouse and cleaning get less water. Plants slow down and things get dirtier, but drinking water is okay for now.',
      },
      {
        id: 'emergency-ice',
        label: 'Melt the emergency ice reserves',
        icon: '🧊',
        effects: [
          { resource: 'water', delta: 8 },
        ],
        narrative:
          'You melted the emergency ice. Plenty of water for now! But those reserves are your last resort — if things get worse later, you\'ll have nothing left.',
      },
    ],
  },

  {
    id: 'earth-message',
    title: 'Message from Earth',
    description:
      'A message from Earth arrived. Good news: the crew\'s families are proud and healthy. Bad news: the next cargo mission was delayed by 3 months.',
    act: 2,
    day: 33,
    system: 'morale',
    room: 'bridge',
    icon: '📨',
    severity: 'normal',
    nasaSource: 'ISS Cargo Resupply',
    popup:
      'The ISS gets cargo ships every few months — but even those sometimes fail. In 2014 and 2015, three cargo missions failed in a row (SpaceX, Orbital, and Progress). The crew had to ration supplies until the next one succeeded.',
    choices: [
      {
        id: 'share-both',
        label: 'Tell the crew everything',
        icon: '📢',
        effects: [
          { resource: 'satisfaction', delta: -5 },
        ],
        narrative:
          'You told the crew both pieces of news. The family messages made people smile, but the cargo delay worried everyone. At least they trust you for being honest.',
      },
      {
        id: 'good-news-first',
        label: 'Share the good news, wait on the bad',
        icon: '😊',
        effects: [
          { resource: 'satisfaction', delta: 5 },
        ],
        narrative:
          'You showed the family messages first. Everyone felt great! You\'ll figure out the cargo problem quietly.',
      },
      {
        id: 'plan-first',
        label: 'Make a plan before telling anyone',
        icon: '📋',
        effects: [
          { resource: 'satisfaction', delta: -2 },
          { resource: 'food', delta: -2 },
        ],
        narrative:
          'You sat down and planned new rations before telling the crew. When you told them, you also showed the plan. The crew appreciated having a solution ready.',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ACT 3 — Days 66-100 — Critical, survival
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'battery-failing',
    title: 'Battery Failing',
    description:
      'The main battery is losing charge faster than normal. If it dies, the station goes dark. No lights, no heat, no oxygen machine.',
    act: 3,
    day: 32,
    system: 'energy',
    room: 'engineering',
    icon: '🔋',
    severity: 'critical',
    nasaSource: 'ISS Battery Replacement EVAs',
    nasaYear: 2017,
    popup:
      'In 2017, ISS astronauts replaced all 48 batteries during multiple spacewalks. The old nickel-hydrogen batteries were swapped for new lithium-ion ones. If the batteries failed completely, the station would lose power during every orbital night.',
    choices: [
      {
        id: 'rewire-backup',
        label: 'Rewire to the backup battery',
        icon: '🔌',
        effects: [
          { resource: 'energy', delta: -10 },
          { resource: 'satisfaction', delta: -5 },
        ],
        narrative:
          'Kira rewired the power system to the smaller backup battery. You have power, but at reduced capacity. Everything runs slower.',
      },
      {
        id: 'repair-main',
        label: 'Try to repair the main battery',
        icon: '🔧',
        effects: [{ resource: 'energy', delta: -5 }],
        narrative:
          'Kira found a corroded connection and cleaned it. Battery is holding charge again — for now.',
        successRate: 60,
        failNarrative:
          'The repair didn\'t work. The battery is still failing. You need to switch to backup.',
        failEffects: [
          { resource: 'energy', delta: -18 },
          { resource: 'satisfaction', delta: -8 },
        ],
      },
      {
        id: 'power-down',
        label: 'Shut down non-essential systems',
        icon: '⚡',
        effects: [
          { resource: 'energy', delta: -5 },
          { resource: 'satisfaction', delta: -10 },
          { resource: 'food', delta: -3 },
        ],
        narrative:
          'You turned off everything except life support. The station is dark and cold. But the battery is lasting. Greenhouse is off — no fresh food for now.',
      },
    ],
  },


  {
    id: 'o2-machine-stopped',
    title: 'O2 Machine Stopped!',
    description:
      'The main oxygen generator has completely stopped. No new oxygen is being made. The station has a limited air supply. Every breath counts.',
    act: 3,
    day: 35,
    system: 'oxygen',
    room: 'engineering',
    icon: '🫁',
    severity: 'critical',
    nasaSource: 'ISS Elektron Oxygen Generator',
    popup:
      'The ISS makes oxygen by splitting water molecules (H2O) into hydrogen and oxygen using electricity. If both the main and backup systems fail, the crew has about 3 days of emergency oxygen from candles and tanks.',
    choices: [
      {
        id: 'emergency-repair',
        label: 'Drop everything and fix it',
        icon: '🔧',
        effects: [
          { resource: 'oxygen', delta: -10 },
          { resource: 'energy', delta: -8 },
        ],
        narrative:
          'The whole crew helped the engineer. After 6 intense hours, the machine sputtered back to life at 60% capacity. Everyone is exhausted.',
        successRate: 70,
        failNarrative:
          'Six hours of work and it still won\'t start. You\'re down to oxygen candles and emergency tanks.',
        failEffects: [
          { resource: 'oxygen', delta: -20 },
          { resource: 'energy', delta: -10 },
          { resource: 'satisfaction', delta: -10 },
        ],
      },
      {
        id: 'candles-and-plants',
        label: 'Use candles and rely on the greenhouse',
        icon: '🌿',
        effects: [
          { resource: 'oxygen', delta: -5 },
          { resource: 'energy', delta: -5 },
        ],
        narrative:
          'You lit oxygen candles and boosted the greenhouse. Plants make oxygen too! Not enough for everyone, but it buys time for repairs.',
      },
      {
        id: 'reduce-activity',
        label: 'Reduce all activity to save air',
        icon: '🛏️',
        effects: [
          { resource: 'oxygen', delta: -3 },
          { resource: 'satisfaction', delta: -10 },
          { resource: 'health', delta: -5 },
        ],
        narrative:
          'Everyone stays in bed. Less movement means less oxygen used. The station is eerily quiet. The machine needs to be fixed soon.',
      },
    ],
  },



  {
    id: 'maya-discovery',
    title: 'Maya\'s Discovery',
    description:
      'Maya, the scientist, found something incredible in her Mars atmosphere samples. It could be evidence of ancient microbial life! But analyzing it properly takes a lot of energy.',
    act: 3,
    day: 39,
    system: 'science',
    room: 'lab',
    icon: '🔬',
    severity: 'normal',
    nasaSource: 'NASA Perseverance Rover / Mars Sample Return',
    nasaYear: 2024,
    popup:
      'NASA\'s Perseverance rover has been collecting Mars rock samples since 2021. Scientists believe Mars once had water and could have supported microbial life. Finding proof of ancient life on Mars would be the biggest scientific discovery in history!',
    choices: [
      {
        id: 'full-analysis',
        label: 'Run the full analysis now',
        icon: '🧪',
        effects: [
          { resource: 'energy', delta: -10 },
          { resource: 'satisfaction', delta: 15 },
        ],
        narrative:
          'Maya ran every test she had. The results are incredible — strong signs of ancient microbial chemistry! This could change history. The crew is buzzing with excitement.',
      },
      {
        id: 'save-sample',
        label: 'Save the sample for Earth labs',
        icon: '📦',
        effects: [
          { resource: 'satisfaction', delta: -3 },
        ],
        narrative:
          'You sealed the sample for return to Earth. The proper labs there can do much better analysis. Maya is disappointed but understands.',
      },
      {
        id: 'quick-test',
        label: 'Run a quick test with less energy',
        icon: '⚡',
        effects: [
          { resource: 'energy', delta: -5 },
          { resource: 'satisfaction', delta: 8 },
        ],
        narrative:
          'Maya ran a basic test. Promising signs but not conclusive. The sample is saved for a full Earth analysis. The crew is hopeful.',
      },
    ],
  },

  {
    id: 'cargo-ship-collision',
    title: 'Cargo Ship Collision!',
    description:
      'An unmanned cargo ship approaching the station lost its navigation. It\'s drifting toward you! You have minutes to react.',
    act: 3,
    day: 40,
    system: 'shielding',
    room: 'bridge',
    icon: '🚀',
    severity: 'critical',
    nasaSource: 'MIR-Progress Collision',
    nasaYear: 1997,
    popup:
      'THIS REALLY HAPPENED! In 1997, an unmanned Progress cargo ship crashed into the MIR space station during a docking test. It punctured the Spektr module, causing rapid decompression. The crew had to seal the module in minutes to survive.',
    choices: [
      {
        id: 'dodge-thrusters',
        label: 'Fire thrusters to move away',
        icon: '🎯',
        effects: [
          { resource: 'energy', delta: -12 },
        ],
        narrative:
          'The pilot fired thrusters and the station dodged just in time! The cargo ship drifted past. But you used a lot of fuel.',
        successRate: 75,
        failNarrative:
          'Not enough time! The cargo ship clipped the station. A module is damaged and losing air.',
        failEffects: [
          { resource: 'energy', delta: -10 },
          { resource: 'oxygen', delta: -15 },
          { resource: 'health', delta: -8 },
        ],
      },
      {
        id: 'remote-redirect',
        label: 'Try to redirect the cargo ship remotely',
        icon: '📡',
        effects: [{ resource: 'energy', delta: -5 }],
        narrative:
          'You sent commands to the cargo ship\'s thrusters. It turned just enough to miss! The cargo is lost in space though.',
        successRate: 55,
        failNarrative:
          'The cargo ship didn\'t respond. It scraped along the hull, damaging solar panels.',
        failEffects: [
          { resource: 'energy', delta: -15 },
          { resource: 'satisfaction', delta: -10 },
        ],
      },
      {
        id: 'brace-evacuate',
        label: 'Brace for impact and prepare to seal rooms',
        icon: '🛡️',
        effects: [
          { resource: 'oxygen', delta: -8 },
          { resource: 'satisfaction', delta: -12 },
          { resource: 'health', delta: -5 },
        ],
        narrative:
          'The ship hit and punctured one module. The crew sealed it in seconds — practiced this drill many times. You lost that module\'s equipment but everyone is alive.',
      },
    ],
  },

  {
    id: 'who-eats-more',
    title: 'Who Eats More?',
    description:
      'The food tracking system shows someone is eating extra portions at night. Food is running low. Do you investigate or trust the crew?',
    act: 3,
    day: 42,
    system: 'food',
    room: 'common',
    icon: '🍪',
    severity: 'normal',
    nasaSource: 'NASA Behavioral Health / Submarine Studies',
    popup:
      'In isolated environments like submarines and Antarctic stations, stress eating is very common. NASA studies show astronauts may eat more when anxious. On a Mars mission, food is limited and every calorie is tracked.',
    choices: [
      {
        id: 'investigate',
        label: 'Check the camera recordings',
        icon: '📹',
        effects: [
          { resource: 'satisfaction', delta: -8 },
          { resource: 'food', delta: 2 },
        ],
        narrative:
          'You found who it was. They were stress eating from anxiety. You talked to them privately. They apologized. But the crew feels watched.',
      },
      {
        id: 'lock-food',
        label: 'Lock the food storage',
        icon: '🔒',
        effects: [
          { resource: 'food', delta: 3 },
          { resource: 'satisfaction', delta: -10 },
        ],
        narrative:
          'Nobody can snack anymore. Food is safe but the crew feels like prisoners. Trust is damaged.',
      },
      {
        id: 'group-talk',
        label: 'Talk to the whole crew about it',
        icon: '🗣️',
        effects: [
          { resource: 'food', delta: 1 },
          { resource: 'satisfaction', delta: 3 },
        ],
        narrative:
          'You brought it up gently at a crew meeting. The person admitted it on their own. The crew was understanding — everyone is stressed. Problem solved with trust.',
      },
    ],
  },

  {
    id: 'transmit-or-save',
    title: 'Transmit or Save Energy?',
    description:
      'Maya\'s science data is ready to send to Earth. But transmitting uses a lot of energy, and the batteries are struggling. Do you send the data or save power?',
    act: 3,
    day: 43,
    system: 'energy',
    room: 'bridge',
    icon: '📡',
    severity: 'normal',
    nasaSource: 'Deep Space Network',
    popup:
      'NASA\'s Deep Space Network uses giant antennas in California, Spain, and Australia to communicate with spacecraft. Sending data from Mars takes enormous power. The Mars rovers sometimes store data for days, waiting for the best transmission window.',
    choices: [
      {
        id: 'transmit-all',
        label: 'Send all the data now',
        icon: '📤',
        effects: [
          { resource: 'energy', delta: -12 },
          { resource: 'satisfaction', delta: 10 },
        ],
        narrative:
          'You transmitted everything. Earth received Maya\'s discovery data! The science team is ecstatic. But the batteries dipped dangerously low overnight.',
      },
      {
        id: 'send-summary',
        label: 'Send just a summary to save power',
        icon: '📝',
        effects: [
          { resource: 'energy', delta: -5 },
          { resource: 'satisfaction', delta: 5 },
        ],
        narrative:
          'You sent a compressed summary. Earth knows about the discovery but wants more detail. You saved energy for life support.',
      },
      {
        id: 'save-for-return',
        label: 'Store it and bring it home',
        icon: '💾',
        effects: [
          { resource: 'satisfaction', delta: -5 },
        ],
        narrative:
          'You saved all the energy. Maya is disappointed — she wanted the world to know. But the station needs power more than glory right now.',
      },
    ],
  },

  {
    id: 'countdown-begins',
    title: 'Countdown Begins',
    description:
      'Day 88. The return window opens in 2 days. The ship needs to be ready. What do you prioritize for the final preparations?',
    act: 3,
    day: 44,
    system: 'engineering',
    room: 'bridge',
    icon: '⏱️',
    severity: 'normal',
    nasaSource: 'Mars Transfer Orbit Windows',
    popup:
      'Mars and Earth align for a return trip only once every 26 months. Miss the window and you\'re stuck for over 2 more years. The return journey takes about 9 months. NASA calls this the "launch window" and it\'s non-negotiable — physics decides, not humans.',
    choices: [
      {
        id: 'check-engines',
        label: 'Focus on engine checks',
        icon: '🚀',
        effects: [
          { resource: 'energy', delta: -8 },
          { resource: 'satisfaction', delta: 5 },
        ],
        narrative:
          'Every engine system checked and double-checked. The ship is ready. The crew feels confident about the journey home.',
      },
      {
        id: 'pack-science',
        label: 'Focus on packing science samples',
        icon: '📦',
        effects: [
          { resource: 'energy', delta: -5 },
          { resource: 'satisfaction', delta: 8 },
        ],
        narrative:
          'You carefully packed every Mars sample and data drive. Maya\'s discovery is safe. If you make it home, this data could change science.',
      },
      {
        id: 'rest-crew',
        label: 'Let the crew rest before the journey',
        icon: '😴',
        effects: [
          { resource: 'health', delta: 5 },
          { resource: 'satisfaction', delta: 5 },
        ],
        narrative:
          'You gave the crew a day to rest and prepare mentally. Everyone slept, exercised, and wrote letters home. They\'re ready.',
      },
    ],
  },

  {
    id: 'final-day',
    title: 'The Final Day',
    description:
      'Day 45. It\'s time to leave Mars orbit and begin the long journey home. One last decision before you go.',
    act: 3,
    day: 45,
    system: 'mission',
    room: 'bridge',
    icon: '🌍',
    severity: 'normal',
    nasaSource: 'NASA Artemis / Mars Mission Planning',
    popup:
      'No human has ever left Earth orbit and returned from another planet. Your crew would be the first. The journey home takes about 9 months. Everything you learned, every choice you made, brought you to this moment.',
    choices: [
      {
        id: 'leave-beacon',
        label: 'Leave a beacon for the next mission',
        icon: '📡',
        effects: [
          { resource: 'energy', delta: -5 },
          { resource: 'satisfaction', delta: 10 },
        ],
        narrative:
          'You deployed a small beacon in Mars orbit. It will guide the next crew — the next generation of explorers. Your mission doesn\'t end here; it opens the door for others.',
      },
      {
        id: 'take-everything',
        label: 'Take every sample and piece of data',
        icon: '📦',
        effects: [
          { resource: 'energy', delta: -3 },
          { resource: 'satisfaction', delta: 8 },
        ],
        narrative:
          'You packed the ship full of Mars samples, data, and memories. The science will keep researchers busy for decades. Time to go home.',
      },
      {
        id: 'one-last-look',
        label: 'Gather the crew for one last look at Mars',
        icon: '🪟',
        effects: [
          { resource: 'satisfaction', delta: 15 },
        ],
        narrative:
          'The whole crew gathered at the window. Mars glowed red and orange below. Nobody spoke for a long time. Then the Commander said: "Let\'s go home." And you fired the engines toward Earth.',
      },
    ],
  },
];

/**
 * Every mission in the game: the missions above plus the ones rewritten from the team's
 * missoes.txt, one batch of up to 10 at a time (src/data/missionsBatch1.ts = missions 1-10).
 */
export const MISSIONS: Mission[] = [...MISSIONS_BASE, ...MISSIONS_BATCH_1];

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}
