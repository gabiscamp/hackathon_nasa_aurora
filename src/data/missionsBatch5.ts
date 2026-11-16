import type { Mission, StationCondition } from './missions';

/**
 * Batch 5 of the team's missoes.txt: problems P28 to P37 (energy, and the first radiation problems).
 * Spacewalk doses ("Dose +8 para o tripulante") are personal (crewDose); a quarter of each dose also
 * shows on the station Radiation bar. Science goals ("+1 objetivo de ciência") are kept in the
 * 'science' counter for the ending. P47 (not written in missoes.txt yet) is kept as a flag.
 * Days follow the 45-day mission (the file's "day 60" became day 30).
 */

/** The CME arrives in 2 days (P36): extra station radiation that day. */
function cme(dose: number): StationCondition {
  return {
    id: 'storm',
    label: `Solar storm (CME) coming: radiation +${dose} when it arrives`,
    daily: [{ resource: 'radiation', delta: dose }],
    days: 1,
    startsInDays: 1,
  };
}

/** Solar panels: +15 in the sun, -15 in each Mars shadow (days 6, 18, 30, 42). */
const SOLAR_DAYS = [
  { afterDays: 5, effects: [{ resource: 'energy' as const, delta: -15 }], text: 'Mars shadow: no sunlight for the solar panels (energy -15).' },
  { afterDays: 11, effects: [{ resource: 'energy' as const, delta: 15 }], text: 'Full sunlight again: the solar panels charge the battery (energy +15).' },
  { afterDays: 17, effects: [{ resource: 'energy' as const, delta: -15 }], text: 'Mars shadow: no sunlight for the solar panels (energy -15).' },
  { afterDays: 23, effects: [{ resource: 'energy' as const, delta: 15 }], text: 'Full sunlight again: the solar panels charge the battery (energy +15).' },
  { afterDays: 29, effects: [{ resource: 'energy' as const, delta: -15 }], text: 'Mars shadow: no sunlight for the solar panels (energy -15).' },
  { afterDays: 35, effects: [{ resource: 'energy' as const, delta: 15 }], text: 'Full sunlight again: the solar panels charge the battery (energy +15).' },
  { afterDays: 41, effects: [{ resource: 'energy' as const, delta: -15 }], text: 'Mars shadow: no sunlight for the solar panels (energy -15).' },
];

export const MISSIONS_BATCH_5: Mission[] = [
  // ─── P28: Escolher a usina — Day 1 ───
  {
    id: 'power-plant',
    sourceRef: 'P28',
    title: 'Choose the Power Plant',
    description: 'Before the mission starts, the Commander chooses where the station gets its power: solar panels or a small nuclear power source?',
    act: 1,
    day: 1,
    system: 'energy',
    room: 'bridge',
    icon: '⚡',
    severity: 'normal',
    nasaSource: 'NASA power systems (solar arrays and Kilopower)',
    factKind: 'tip',
    popup:
      'SPACE TIP: The ISS uses huge solar panels. For Mars, NASA tested Kilopower, a small nuclear power source that works day and night, even in dust storms.',
    defer: false,
    choices: [
      {
        id: 'solar',
        label: 'Solar panels',
        icon: '☀️',
        crew: { min: 1, best: ['engineer'] },
        time: '1 hour',
        fatigue: 0,
        effects: [],
        onSuccess: {
          setFlags: ['solar-power'],
          delayed: SOLAR_DAYS,
          addConditions: [{ id: 'solar-power', label: 'Solar power: energy +1 every day', daily: [{ resource: 'energy', delta: 1 }] }],
        },
        narrative:
          'Solar panels it is! Energy +1 every day, +15 in sunlight, but -15 every time the station passes into Mars\' shadow. Each shadow, you will have to choose what to turn off.',
      },
      {
        id: 'nuclear',
        label: 'Nuclear power source',
        icon: '⚛️',
        crew: { min: 1, best: ['engineer'] },
        time: '1 hour',
        fatigue: 0,
        effects: [],
        onSuccess: {
          setFlags: ['nuclear-power'],
          addConditions: [{ id: 'nuclear-power', label: 'Nuclear power: energy +3 every day', daily: [{ resource: 'energy', delta: 3 }] }],
        },
        narrative: 'A small nuclear power source: energy +3 every day, day and night, shadow or not.',
      },
    ],
  },

  // ─── P29: Gastar agora ou guardar — Day 4 (the shadow comes on day 6) ───
  {
    id: 'spend-or-save',
    sourceRef: 'P29',
    title: 'Spend It Now or Save It?',
    description: 'The battery is full and the lab wants to run a big experiment. But the Mars shadow is only 2 days away...',
    act: 1,
    day: 4,
    system: 'energy',
    room: 'lab',
    icon: '🔬',
    severity: 'normal',
    nasaSource: 'ISS science operations',
    factKind: 'tip',
    popup: 'SPACE TIP: Running experiments in space uses a lot of power. ISS teams plan big experiments for times when there is plenty of energy.',
    defer: false,
    choices: [
      {
        id: 'run-experiment',
        label: 'Run the experiment',
        icon: '🧪',
        crew: { min: 1, max: 2, best: ['scientist'] },
        time: 'All day',
        effects: [{ resource: 'energy', delta: -20 }],
        onSuccess: {
          counter: { id: 'science', add: 1 },
          followUps: [{ missionId: 'survival-mode', afterDays: 2 }],
        },
        narrative:
          '{crew} ran the big experiment: +1 science goal! But it used a lot of battery, and the shadow comes in 2 days. The station will have to go into survival mode.',
      },
      {
        id: 'save-energy',
        label: 'Save the energy',
        icon: '🔋',
        crew: { min: 1 },
        time: '10 minutes',
        fatigue: 0,
        effects: [],
        narrative: 'The battery stays full for the shadow. The experiment can wait.',
      },
    ],
  },

  // ─── P36: Uma tempestade saiu do Sol — Day 8 ───
  {
    id: 'solar-storm-warning',
    sourceRef: 'P36',
    title: 'A Storm Left the Sun!',
    description:
      'NASA DONKI warns: a coronal mass ejection (a giant cloud from the Sun, called a CME) is heading to Mars. It arrives in about 2 days. When do we build the shelter?',
    act: 1,
    day: 8,
    system: 'radiation',
    room: 'bridge',
    icon: '☀️',
    severity: 'critical',
    nasaSource: 'NASA DONKI',
    factKind: 'tip',
    popup:
      'SPACE TIP: NASA\'s DONKI database tracks every CME that leaves the Sun and predicts when it will reach Earth or Mars. This game reads real DONKI data: look in Credits!',
    defer: false,
    choices: [
      {
        id: 'shelter-now',
        label: 'Build the shelter right away',
        icon: '🏗️',
        crew: { min: 2, max: 4 },
        time: '2 days',
        busyDays: 1,
        effects: [],
        onSuccess: { addConditions: [cme(3)] },
        narrative: '{crew} spent 2 days building the shelter. Ready in time: it blocks 80% of the storm.',
      },
      {
        id: 'shelter-later',
        label: 'Build it just before it arrives',
        icon: '⏰',
        crew: { min: 2, max: 3 },
        time: 'Half a day',
        noVerdict: true,
        successRate: 70,
        effects: [],
        onSuccess: { addConditions: [cme(3)] },
        onFail: { addConditions: [cme(9)] },
        narrative: 'The forecast was right! {crew} built the shelter just in time, and no work days were lost. It blocks 80% of the storm.',
        failNarrative: 'The storm came earlier than forecast! {crew} only finished half the shelter: it blocks just 40%.',
      },
    ],
  },

  // ─── P31: Quais módulos aquecer — every 9 days from Day 8 ───
  {
    id: 'which-modules-heat',
    sourceRef: 'P31',
    title: 'Which Modules Do We Heat?',
    description: 'The night is cold and there is not enough energy to heat every module. Heat everything, or only the cabins and the machine room?',
    act: 1,
    day: 8,
    repeatEveryDays: 9,
    system: 'energy',
    room: 'engineering',
    icon: '🌡️',
    severity: 'normal',
    nasaSource: 'ISS thermal control',
    factKind: 'tip',
    popup: 'SPACE TIP: Space is very cold in the shadow and very hot in the sunlight. Heaters and coolers keep the station at about 22 °C, like a nice room on Earth.',
    defer: false,
    choices: [
      {
        id: 'heat-all',
        label: 'Heat every module',
        icon: '🔥',
        crew: { min: 1, best: ['engineer'] },
        time: '15 minutes',
        fatigue: 0,
        effects: [
          { resource: 'satisfaction', delta: 5 },
          { resource: 'energy', delta: -15 },
        ],
        narrative: 'Warm everywhere! Everyone is comfy, but it used a lot of energy.',
      },
      {
        id: 'heat-some',
        label: 'Only the cabins and the machine room',
        icon: '🛏️',
        crew: { min: 1, best: ['engineer'] },
        time: '15 minutes',
        fatigue: 0,
        effects: [
          { resource: 'energy', delta: -5 },
          { resource: 'food', delta: -5 },
        ],
        onSuccess: {
          counter: { id: 'cold-nights', add: 1 },
          followUps: [{ missionId: 'low-vitamins', afterDays: 1, requiresCounter: { id: 'cold-nights', atLeast: 3 } }],
        },
        narrative: 'Energy saved, but the greenhouse got cold and grew less food. Too many cold nights and the crew will miss their vitamins.',
      },
    ],
  },

  // ─── P34: Turno extra no laboratório — Day 16 ───
  {
    id: 'lab-night-shift',
    sourceRef: 'P34',
    title: 'Extra Shift in the Lab',
    description: 'The scientists want to work through the night to get more research done.',
    act: 2,
    day: 16,
    system: 'energy',
    room: 'lab',
    icon: '🌙',
    severity: 'normal',
    nasaSource: 'ISS crew schedules',
    factKind: 'tip',
    popup: 'SPACE TIP: Astronauts follow a careful schedule with 8.5 hours of sleep. Working too late makes people tired and more likely to make mistakes.',
    defer: false,
    choices: [
      {
        id: 'allow-shift',
        label: 'Allow the extra shift',
        icon: '✅',
        crew: { min: 1, max: 2, best: ['scientist'] },
        time: 'All night',
        fatigue: 2,
        effects: [
          { resource: 'energy', delta: -10 },
          { resource: 'satisfaction', delta: -3 },
        ],
        sideRisk: { chance: 20, effects: [], text: 'In the morning a bed in the crew quarters got stuck and nobody slept well.', setFlags: ['bed-stuck'] },
        onSuccess: { counter: { id: 'science', add: 1 } },
        narrative: '{crew} worked all night: +1 science goal! Everyone is a bit more tired.',
      },
      {
        id: 'deny-shift',
        label: 'No, everybody sleeps',
        icon: '😴',
        crew: { min: 1, best: ['commander'] },
        time: '5 minutes',
        fatigue: 0,
        effects: [],
        narrative: 'Bedtime! Nothing changes.',
      },
    ],
  },

  // ─── P32: O que vem primeiro — Day 21 ───
  {
    id: 'what-comes-first',
    sourceRef: 'P32',
    title: 'What Comes First?',
    description: 'The oxygen machine, the water recycler and the radio all need power at the same time. There is not enough for all three.',
    act: 2,
    day: 21,
    system: 'energy',
    room: 'bridge',
    icon: '⚖️',
    severity: 'normal',
    nasaSource: 'ISS power management',
    factKind: 'tip',
    popup: 'SPACE TIP: On a space station, life support always comes first. Mission Control can wait a day for a message; the crew can\'t wait for air.',
    defer: false,
    choices: [
      {
        id: 'life-support-first',
        label: 'Life support first',
        icon: '🫁',
        crew: { min: 1, best: ['commander'] },
        time: '15 minutes',
        fatigue: 0,
        effects: [],
        onSuccess: { addConditions: [{ id: 'no-earth-contact', label: 'No contact with Earth', daily: [], days: 1 }] },
        narrative: 'Oxygen and water keep running. The radio is off for a day: no contact with Earth.',
      },
      {
        id: 'keep-radio',
        label: 'Keep the radio on',
        icon: '📡',
        crew: { min: 1 },
        time: '15 minutes',
        fatigue: 0,
        effects: [{ resource: 'oxygen', delta: -10 }],
        narrative: 'You stay in touch with Earth, but the oxygen machine makes less air today.',
      },
    ],
  },

  // ─── P37: Conserto do lado de fora — Day 27 ───
  {
    id: 'outside-repair',
    sourceRef: 'P37',
    title: 'Outside Repair Before the Storm',
    description: 'A part on the outside of the station broke, and a solar storm is getting close. Go out now, or wait?',
    act: 2,
    day: 27,
    system: 'radiation',
    room: 'airlock',
    icon: '🧑‍🚀',
    severity: 'normal',
    nasaSource: 'ISS spacewalks',
    factKind: 'tip',
    popup:
      'SPACE TIP: Spacesuits do not block much radiation. That is why NASA plans spacewalks for days when the Sun is calm.',
    defer: { effects: [{ resource: 'energy', delta: -3 }], text: 'The broken part waits outside one more day.' },
    choices: [
      {
        id: 'go-now',
        label: 'Go out and fix it now',
        icon: '🏃',
        spacewalk: true,
        crew: { min: 1, best: ['engineer'] },
        time: '5 hours outside',
        fatigue: 2,
        effects: [{ resource: 'oxygen', delta: -3 }],
        onSuccess: { crewDose: 8 },
        narrative: '{crew} went outside before the storm and fixed the part. It works again! But the spacewalk added to {crew}\'s radiation dose.',
      },
      {
        id: 'postpone',
        label: 'Postpone the repair',
        icon: '⏳',
        crew: { min: 1 },
        time: '10 minutes',
        fatigue: 0,
        temporary: true,
        effects: [],
        onSuccess: {
          addConditions: [{ id: 'outside-broken-storm', label: 'Broken part outside', daily: [{ resource: 'energy', delta: -3 }] }],
          followUps: [{ missionId: 'outside-repair-later', afterDays: 3 }],
        },
        narrative: 'Nobody goes out in the storm. The broken part costs a little energy every day until someone fixes it.',
      },
    ],
  },

  // ─── P33: A bateria envelheceu — Day 30 (Day 20 if the spare battery was used for the greenhouse) ───
  {
    id: 'battery-aged',
    sourceRef: 'P33',
    title: 'The Battery Got Old',
    description: 'The main battery is getting old and stores less energy than before.',
    act: 2,
    day: 30,
    system: 'energy',
    room: 'engineering',
    icon: '🔋',
    severity: 'normal',
    nasaSource: 'ISS battery replacement',
    nasaYear: 2017,
    factKind: 'history',
    popup:
      'THIS REALLY HAPPENED! Between 2017 and 2021, astronauts did many spacewalks to replace the old batteries of the ISS with new lithium-ion batteries. One new battery replaced two old ones!',
    defer: false,
    choices: [
      {
        id: 'swap-spare',
        label: 'Swap in the spare battery',
        icon: '🔄',
        crew: { min: 1, best: ['engineer'] },
        time: '3 hours',
        effects: [{ resource: 'energy', delta: -10 }],
        narrative: '{crew} swapped in the spare battery. Full capacity again!',
      },
      {
        id: 'accept-it',
        label: 'Live with a weaker battery',
        icon: '🪫',
        crew: { min: 1 },
        time: '10 minutes',
        fatigue: 0,
        effects: [],
        onSuccess: {
          setFlags: ['weak-battery'],
          followUps: [{ missionId: 'survival-mode', afterDays: 3, afterDaysMax: 8 }],
        },
        narrative: 'The battery stays as it is. Every shadow will cost 5 more energy, and at the next one the station must go into survival mode.',
      },
    ],
  },

  // ─── P35: Painel solar travado — Day 31 ───
  {
    id: 'stuck-solar-panel',
    sourceRef: 'P35',
    title: 'Stuck Solar Panel',
    description: 'One of the solar panels is stuck and can only be fixed from outside the station.',
    act: 3,
    day: 31,
    system: 'energy',
    room: 'airlock',
    icon: '🔆',
    severity: 'normal',
    nasaSource: 'ISS solar array repair',
    nasaYear: 2007,
    factKind: 'history',
    popup:
      'THIS REALLY HAPPENED! In 2007, a solar panel on the ISS tore while it was opening. Astronaut Scott Parazynski rode on the end of the robotic arm and fixed it with homemade "cufflinks" made of wire.',
    defer: { effects: [{ resource: 'energy', delta: -5 }], text: 'The stuck panel makes less power: energy -5.' },
    choices: [
      {
        id: 'spacewalk',
        label: 'Spacewalk to fix it',
        icon: '🧑‍🚀',
        spacewalk: true,
        crew: { min: 1, best: ['engineer'] },
        time: '6 hours outside',
        fatigue: 2,
        effects: [{ resource: 'energy', delta: 5 }],
        onSuccess: { crewDose: 3, clearConditions: ['stuck-panel'] },
        narrative: '{crew} went outside and freed the panel. Power is back to normal!',
      },
      {
        id: 'stay-inside',
        label: 'Stay inside',
        icon: '🏠',
        crew: { min: 1 },
        time: '5 minutes',
        fatigue: 0,
        effects: [],
        onSuccess: {
          addConditions: [{ id: 'stuck-panel', label: 'Stuck solar panel: less power', daily: [{ resource: 'energy', delta: -5 }] }],
        },
        narrative: 'Nobody goes outside. The stuck panel will cost energy every day until it is fixed.',
      },
    ],
  },

  // ─── P30: Modo de sobrevivência — when energy drops below 20 (or after a big experiment / old battery) ───
  {
    id: 'survival-mode',
    sourceRef: 'P30',
    followUpOnly: true,
    repeatable: true,
    trigger: { resource: 'energy', below: 20, fromDay: 2 },
    title: 'Survival Mode?',
    description: 'Energy is very low. Turn on survival mode: everything that is not needed to stay alive gets switched off.',
    act: 2,
    system: 'energy',
    room: 'engineering',
    icon: '🪫',
    severity: 'critical',
    nasaSource: 'Spacecraft safe mode',
    factKind: 'tip',
    popup:
      'SPACE TIP: Spacecraft have a "safe mode". When something goes wrong, they turn off everything except what they need to survive, and wait for help.',
    defer: false,
    choices: [
      {
        id: 'activate',
        label: 'Turn on survival mode',
        icon: '🛡️',
        crew: { min: 1, best: ['engineer'] },
        time: '1 hour',
        fatigue: 0,
        effects: [{ resource: 'satisfaction', delta: -10 }],
        onSuccess: {
          addConditions: [
            { id: 'survival-mode', label: 'Survival mode: energy recovering', daily: [{ resource: 'energy', delta: 10 }], days: 2 },
            { id: 'no-earth-contact', label: 'No contact with Earth', daily: [], days: 2 },
          ],
        },
        narrative: '{crew} switched off everything not needed. Energy +10 a day for 2 days, but it is dark, quiet and lonely: no contact with Earth.',
      },
      {
        id: 'dont-activate',
        label: "Don't turn it on",
        icon: '🎲',
        crew: { min: 1 },
        time: '5 minutes',
        fatigue: 0,
        noVerdict: true,
        successRate: 60,
        effects: [],
        narrative: 'Lucky: the battery held on.',
        onFail: {
          addConditions: [{ id: 'blackout', label: 'Energy ran out: the oxygen machine stopped', daily: [{ resource: 'oxygen', delta: -10 }], days: 2 }],
        },
        failNarrative: 'The energy ran out! The oxygen machine stopped: oxygen -10 a day until power comes back.',
      },
    ],
  },

  // ════════════════ Follow-ups ════════════════
  {
    id: 'outside-repair-later',
    followUpOnly: true,
    title: 'The Storm Has Passed',
    description: 'The storm has passed. Time to fix the broken part outside.',
    act: 2,
    system: 'energy',
    room: 'airlock',
    icon: '🧑‍🚀',
    severity: 'normal',
    nasaSource: 'ISS spacewalks',
    factKind: 'tip',
    popup: 'SPACE TIP: A spacewalk takes hours of preparation. Astronauts breathe pure oxygen first, so they do not get sick from the pressure change.',
    defer: { effects: [{ resource: 'energy', delta: -3 }], text: 'The part waits one more day.' },
    choices: [
      {
        id: 'spacewalk',
        label: 'Spacewalk now (calm Sun)',
        icon: '🧑‍🚀',
        spacewalk: true,
        crew: { min: 1, best: ['engineer'] },
        time: '5 hours outside',
        fatigue: 2,
        effects: [{ resource: 'oxygen', delta: -3 }],
        onSuccess: { crewDose: 3, clearConditions: ['outside-broken-storm'] },
        narrative: '{crew} fixed the part under a calm Sun, with a much smaller radiation dose.',
      },
    ],
  },
];
