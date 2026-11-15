export interface Choice {
  id: string;
  label: string;
  icon: string;
  crewRequired?: string;
  consequences: {
    food?: number;
    water?: number;
    energy?: number;
    oxygen?: number;
    /** Radiation level change: + means MORE radiation (worse). */
    radiation?: number;
    crewEffects?: { id: string; health?: number; morale?: number }[];
    narrative: string;
    successRate?: number;
    failNarrative?: string;
    failEffects?: {
      food?: number;
      water?: number;
      energy?: number;
      oxygen?: number;
      radiation?: number;
      crewEffects?: { id: string; health?: number; morale?: number }[];
    };
  };
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  act: 1 | 2 | 3;
  day?: number;
  system: string;
  icon: string;
  nasaSource: string;
  nasaYear: number;
  popup: string;
  choices: Choice[];
}

export const MISSIONS: Mission[] = [
  {
    id: 'broken-filter',
    title: 'The Broken Filter',
    description: 'The CO2 filter just broke! CO2 is a gas that builds up when you breathe. Too much makes you dizzy and sleepy. You have spare filters, but they are the wrong shape — they don\'t fit the machine.',
    act: 1,
    day: 68,
    system: 'oxygen',
    icon: '🫁',
    nasaSource: 'Apollo 13',
    nasaYear: 1970,
    popup: 'YOU JUST LIVED THROUGH APOLLO 13! In 1970, an oxygen tank exploded 320,000 km from Earth. The CO2 filters didn\'t fit, so engineers on Earth invented an adapter using duct tape and plastic bags. The astronauts built it in space and saved their lives.',
    choices: [
      {
        id: 'build-adapter',
        label: 'Build an adapter',
        icon: '🔧',
        crewRequired: 'engineer',
        consequences: {
          oxygen: -5,
          narrative: '{engineer} worked for 3 hours and built an adapter from tape and plastic. The filter works again! But CO2 rose during the repair.',
          successRate: 80,
          failNarrative: '{engineer} tried but the adapter didn\'t hold. CO2 is still rising. You need another plan.',
          failEffects: { oxygen: -15 },
        },
      },
      {
        id: 'everybody-rest',
        label: 'Everybody rest',
        icon: '😴',
        consequences: {
          oxygen: -3,
          crewEffects: [
            { id: 'engineer', morale: -5 },
            { id: 'medic', morale: -5 },
            { id: 'scientist', morale: -5 },
          ],
          narrative: 'The crew lay still for hours, breathing slowly. CO2 rose slowly but stayed below danger. No work done today — the filter still needs fixing tomorrow.',
        },
      },
      {
        id: 'use-candles',
        label: 'Use oxygen candles',
        icon: '🕯️',
        consequences: {
          oxygen: 5,
          energy: -3,
          narrative: 'You burned one precious oxygen candle. Fresh air! But candles are limited and there\'s a small fire risk. The filter still needs fixing.',
        },
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
    icon: '🔥',
    nasaSource: 'MIR Space Station',
    nasaYear: 1997,
    popup: 'THIS REALLY HAPPENED! In February 1997, an oxygen candle caught fire on the MIR space station. The flames burned for 14 minutes and blocked one of the two escape capsules. The crew fought the fire with extinguishers. Nobody died, but the smoke made the air bad for weeks.',
    choices: [
      {
        id: 'fight-fire',
        label: 'Fight the fire',
        icon: '🧯',
        consequences: {
          oxygen: -8,
          crewEffects: [
            { id: 'engineer', health: -15 },
            { id: 'medic', health: -15 },
          ],
          narrative: 'Two crew members fought the fire with extinguishers for 15 minutes. Fire is out! But toxic smoke fills the air for the next 3 days. Everyone gets headaches.',
        },
      },
      {
        id: 'seal-room',
        label: 'Seal the room',
        icon: '🚪',
        consequences: {
          energy: -10,
          narrative: 'You sealed the door. No air means no fire. It died out. But everything in that room is lost — tools, spare parts, and one escape pod access.',
        },
      },
      {
        id: 'evacuate-safe',
        label: 'Move to safe area',
        icon: '🏃',
        consequences: {
          energy: -5,
          oxygen: -5,
          crewEffects: [
            { id: 'engineer', morale: -10 },
            { id: 'medic', morale: -10 },
            { id: 'scientist', morale: -10 },
          ],
          narrative: 'Everyone moved to the safe section near escape pod 2. The fire burned itself out but may have damaged equipment.',
        },
      },
    ],
  },
  {
    id: 'bathroom-broke',
    title: 'The Bathroom Broke',
    description: 'The toilet and water recycler broke down. In space, the toilet isn\'t just a toilet — it\'s a machine that also recycles water. Without it, you lose water every time someone uses the bathroom.',
    act: 1,
    day: 5,
    system: 'water',
    icon: '🚽',
    nasaSource: 'ISS',
    nasaYear: 2008,
    popup: 'THIS REALLY HAPPENED! The ISS toilet has broken multiple times. In 2008, NASA had to send repair parts on the next cargo ship. Without the toilet\'s water recycler, the station can\'t turn waste back into clean water — and that water is also used to make oxygen!',
    choices: [
      {
        id: 'full-repair',
        label: 'Engineer fixes it today',
        icon: '🔧',
        crewRequired: 'engineer',
        consequences: {
          narrative: '{engineer} spent the whole day repairing the toilet. It works again! But nothing else got fixed today.',
          crewEffects: [{ id: 'engineer', morale: -5 }],
        },
      },
      {
        id: 'use-bags',
        label: 'Use emergency bags',
        icon: '🛍️',
        consequences: {
          oxygen: -3,
          crewEffects: [
            { id: 'engineer', morale: -10 },
            { id: 'medic', morale: -10 },
            { id: 'scientist', morale: -10 },
          ],
          narrative: 'The crew used emergency bags. It works, but it\'s unpleasant. Mood dropped. The water in those bags can\'t be recycled — that water is lost forever.',
        },
      },
      {
        id: 'partial-fix',
        label: 'Quick partial fix',
        icon: '⚡',
        crewRequired: 'engineer',
        consequences: {
          oxygen: -2,
          narrative: '{engineer} did a quick fix — toilet works but the water recycler is still broken. Water from waste isn\'t being recycled yet.',
        },
      },
    ],
  },
  {
    id: 'invisible-leak',
    title: 'The Invisible Leak',
    description: 'Air pressure is dropping very slowly. There is a small leak somewhere on the station, but nobody knows where. It\'s so small you can\'t hear it or see it.',
    act: 1,
    day: 10,
    system: 'pressure',
    icon: '💨',
    nasaSource: 'ISS',
    nasaYear: 2004,
    popup: 'THIS REALLY HAPPENED! In 2004, a slow air leak was detected on the ISS. After days of searching, they found it — a hose that astronauts had been using as a handhold had cracked a seal. Something that simple almost caused a serious emergency.',
    choices: [
      {
        id: 'lockdown-search',
        label: 'Lock down and search',
        icon: '🔒',
        consequences: {
          oxygen: -3,
          narrative: 'You sealed all rooms and checked each one. Found it! A cracked hose seal. Easy fix once found. But it took a full day with everyone in tight spaces.',
          crewEffects: [
            { id: 'engineer', morale: -5 },
            { id: 'medic', morale: -5 },
            { id: 'scientist', morale: -5 },
          ],
        },
      },
      {
        id: 'listen-for-it',
        label: 'Listen for the leak',
        icon: '👂',
        consequences: {
          narrative: 'The crew spread out with leak detectors. Found it in 4 hours! Much faster. A cracked hose seal — fixed quickly.',
          successRate: 85,
          failNarrative: 'Couldn\'t find it today. Pressure dropped more. Tomorrow you\'ll have to do the full lockdown with less air.',
          failEffects: { oxygen: -8 },
        },
      },
      {
        id: 'eva-inspect',
        label: 'Inspect from outside',
        icon: '🧑‍🚀',
        consequences: {
          oxygen: -5,
          energy: -5,
          crewEffects: [{ id: 'engineer', health: -5 }],
          narrative: '{engineer} went outside and found the leak AND two other weak spots. You can fix them before they become leaks too. But {engineer} is exhausted.',
        },
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
    icon: '☠️',
    nasaSource: 'ISS',
    nasaYear: 2006,
    popup: 'THIS REALLY HAPPENED! In 2006, the oxygen generator on the ISS overheated and released toxic smoke. The 3 astronauts had to put on masks and gloves. It was the first real emergency in 8 years of the space station.',
    choices: [
      {
        id: 'masks-restart',
        label: 'Masks on, restart it',
        icon: '😷',
        crewRequired: 'engineer',
        consequences: {
          oxygen: -5,
          narrative: 'Everyone put on masks. {engineer} restarted the machine — it works at 70% power! Needs full repair tomorrow.',
          successRate: 60,
          failNarrative: 'The machine won\'t start. You need to use emergency oxygen candles now.',
          failEffects: { oxygen: -15 },
        },
      },
      {
        id: 'shutdown-candles',
        label: 'Shut down, use candles',
        icon: '🕯️',
        consequences: {
          oxygen: -10,
          narrative: 'Machine off. No more smoke. You lit emergency oxygen candles — each one gives air for 1 person for 1 day. You have 12. That\'s 3 days for a crew of 4. Clock is ticking.',
        },
      },
      {
        id: 'ventilate-wait',
        label: 'Ventilate and wait',
        icon: '🌬️',
        consequences: {
          oxygen: -12,
          narrative: 'Fans pushed the smoke through filters. After 8 hours the air cleared. You found the problem: a burned wire. Easy fix — but a whole day without making oxygen.',
        },
      },
    ],
  },
  {
    id: 'debris-storm',
    title: 'Debris Storm!',
    description: 'A cloud of space debris is heading toward the station! Thousands of pieces, some as small as a marble, flying at 28,000 km/h. At that speed, even a tiny piece can punch through the wall.',
    act: 2,
    day: 28,
    system: 'debris',
    icon: '☄️',
    nasaSource: 'ISS',
    nasaYear: 2021,
    popup: 'THIS REALLY HAPPENED! In November 2021, Russia destroyed a satellite with a missile. It created over 1,500 pieces of debris that passed near the ISS. All 7 astronauts had to get into their escape capsules and wait for 2 hours. NASA called it "irresponsible."',
    choices: [
      {
        id: 'escape-pods',
        label: 'Everyone to escape pods',
        icon: '🚀',
        consequences: {
          crewEffects: [
            { id: 'engineer', morale: -10 },
            { id: 'medic', morale: -10 },
            { id: 'scientist', morale: -10 },
          ],
          narrative: 'Everyone squeezed into the escape capsules for 2 hours. The debris passed without hitting the station. Safe, but 2 hours of work lost.',
        },
      },
      {
        id: 'shelter-core',
        label: 'Shelter in the core',
        icon: '🛡️',
        consequences: {
          narrative: 'You sealed the outer modules and everyone stayed in the center. The debris passed. Work continued at half speed.',
          successRate: 95,
          failNarrative: 'A piece hit an outer module! Small pressure drop. The hatch was closed so the crew is fine, but you lost some equipment.',
          failEffects: { energy: -10, radiation: 5 }, // was shielding -5 (less protection = more radiation)
        },
      },
      {
        id: 'dodge-station',
        label: 'Move the station',
        icon: '🎯',
        crewRequired: 'scientist',
        consequences: {
          energy: -8,
          narrative: '{scientist} calculated the perfect dodge. Thrusters fired and the station moved to a safe orbit. But fuel is limited — can\'t do this often.',
          successRate: 90,
          failNarrative: 'The dodge wasn\'t enough. A small piece clipped a solar panel.',
          failEffects: { energy: -15 },
        },
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
    icon: '📡',
    nasaSource: 'CHAPEA Mars Simulation',
    nasaYear: 2025,
    popup: 'THIS HAPPENED IN A SIMULATION! During NASA\'s CHAPEA Mars experiment, the 4-person crew went 2 full weeks without ANY communication from the outside. They had to make every decision on their own. This is what a real Mars mission would be like.',
    choices: [
      {
        id: 'stay-calm',
        label: 'Stay calm, keep routine',
        icon: '😌',
        consequences: {
          crewEffects: [
            { id: 'engineer', morale: -5 },
            { id: 'medic', morale: -5 },
            { id: 'scientist', morale: -5 },
          ],
          narrative: 'You told the crew to follow the normal schedule. Communication came back in 2 days. It was just a technical glitch on Earth\'s side.',
        },
      },
      {
        id: 'boost-antenna',
        label: 'Boost the antenna',
        icon: '📡',
        consequences: {
          energy: -8,
          oxygen: -3,
          narrative: 'You redirected power to the antenna. You reached Earth! They said it was a minor equipment problem on their end.',
          successRate: 70,
          failNarrative: 'Still no contact. You used extra energy for nothing. The crew is colder and oxygen production was slower.',
          failEffects: { energy: -5, oxygen: -5 },
        },
      },
      {
        id: 'emergency-protocol',
        label: 'Emergency protocol',
        icon: '🚨',
        consequences: {
          energy: -5,
          crewEffects: [
            { id: 'engineer', morale: -15 },
            { id: 'medic', morale: -15 },
            { id: 'scientist', morale: -15 },
          ],
          narrative: 'You assumed the worst and prepared for an emergency. Turns out it was just a glitch. But the crew is now scared and will work slower tomorrow.',
        },
      },
    ],
  },
];
