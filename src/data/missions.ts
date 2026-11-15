import type { ResourceKey } from '../stores/useResourceStore';
import { MISSIONS_BATCH_1 } from './missionsBatch1';
import { MISSIONS_BATCH_2 } from './missionsBatch2';
import { MISSIONS_BATCH_3 } from './missionsBatch3';
import { MISSIONS_BATCH_4 } from './missionsBatch4';

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
  /** Only these people can do it (e.g. the medic examines the food). */
  only?: CrewSlot[];
}

/** A second, independent risk of a choice (e.g. "10% chance to rip food packets"). */
export interface SideRisk {
  /** Chance in %. */
  chance: number;
  /** Chance grows with a counter (e.g. weeks of eating the newest food first): steps[counter]. */
  steps?: { counter: string; chances: number[] };
  effects: ChoiceEffect[];
  text: string;
  /** No risk while this station condition is active (e.g. the medic checked the pantry). */
  unlessCondition?: string;
  /** Flags set when it happens (e.g. 'pests' cancels a future harvest). */
  setFlags?: string[];
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
  /** For patient missions: the same crew member stays the patient (sick → very sick). */
  samePatient?: boolean;
  /** Only when a counter has reached this (e.g. food thrown away 3 times → trash problem). */
  requiresCounter?: { id: string; atLeast: number };
}

/** Resources that change later (e.g. replanted lettuce gives food in 15 days). */
export interface DelayedEffect {
  afterDays: number;
  effects: ChoiceEffect[];
  /** Morning news when it happens. */
  text: string;
  /** Cancelled if this flag is set by then (e.g. pests ate the plants). */
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
  /** Starts this many days later (e.g. the bigger greenhouse feeds the crew from day 3). */
  startsInDays?: number;
  /** Chance (%) each day that someone gets sick (problem 1), growing day by day: [day 1, day 2, …]. */
  sickChance?: number[];
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
  /** Patient missions: how the sick crew member is treated (missoes.txt, problems 1 and 2). */
  illness?: 'rest' | 'isolation' | 'working' | 'severe';
  /** Changes a counter (e.g. weeks in a row eating the newest food). */
  counter?: { id: string; add?: number; reset?: boolean };
  delayed?: DelayedEffect[];
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
  /** Only offered when this flag is set (e.g. lettuce saved for the party). */
  requiresFlag?: string;
  /** Not offered while this station condition is active (e.g. no video call without radio contact). */
  hiddenIfCondition?: string;
  /** Extra effects when a "Best:" specialist is sent (e.g. the medic gives the vitamins: +15 instead of +10). */
  bestBonus?: ChoiceEffect[];
  /** A limited stock (e.g. 3 uses of vitamin supplements): locked when the counter reaches max. */
  maxUses?: { counter: string; max: number };
  /** If it fails, the mission comes back at once without this choice. */
  retryOnFail?: boolean;
  onSuccess?: Outcome;
  onFail?: Outcome;
  /** Applied when a multi-day job ends normally (e.g. the repair is finished). */
  onDone?: Outcome;
  /** If the crew is pulled off this job before it ends. */
  onInterrupt?: { effects: ChoiceEffect[]; text: string; resumeMissionId?: string };
  /** Plain luck, not skill (e.g. how strong the storm is): no "It worked!", crew does not change the chance. */
  noVerdict?: boolean;
  /** A spacewalk: helped by extra food for spacewalkers (problem 6). */
  spacewalk?: boolean;
  sideRisk?: SideRisk;
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
  /** Number of the mission in the team's missoes.txt ("Missões detalhadas"). */
  sourceNumber?: number;
  /** Id in missoes.txt: "M11" = detailed mission 11, "P3" = problem 3 (second part of the file). */
  sourceRef?: string;
  /** Comes back every N days until the mission ends (weekly choices). */
  repeatEveryDays?: number;
  /** Can happen more than once (e.g. someone gets sick). */
  repeatable?: boolean;
  /** About one sick crew member: {patient} in the texts. */
  patient?: boolean;
  /** About one crew member who is not sick (the birthday person): {honoree} in the texts. */
  honoree?: boolean;
  /** Happens by itself when a station bar crosses a line (once, or again if repeatable). */
  trigger?: { resource: ResourceKey; below?: number; above?: number; fromDay?: number; chance?: number };
  /** A fixed-day mission comes later if this flag is set (e.g. the harvest is 3 days late). */
  delayIfFlag?: { flag: string; days: number };
  /** A fixed-day mission does not happen if this flag is set (e.g. the plants died). */
  skipIfFlag?: string;
}

/** Missions written before crew assignment existed need one person, two at most. */
export const DEFAULT_CREW_NEED: CrewNeed = { min: 1, max: 2 };

export const MISSIONS_BASE: Mission[] = [
  // ═══════════════════════════════════════════════════════════════
  // ACT 1 — Days 1-15 — Easy, learning
  // ═══════════════════════════════════════════════════════════════






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




  // ═══════════════════════════════════════════════════════════════
  // ACT 2 — Days 26-65 — Hard, cascading crises
  // ═══════════════════════════════════════════════════════════════


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
export const MISSIONS: Mission[] = [...MISSIONS_BASE, ...MISSIONS_BATCH_1, ...MISSIONS_BATCH_2, ...MISSIONS_BATCH_3, ...MISSIONS_BATCH_4];

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}
