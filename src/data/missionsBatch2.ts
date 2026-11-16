import type { Mission, StationCondition } from './missions';

/**
 * Batch 2 of the team's missoes.txt (src/data/missionsBatch1.ts has batch 1):
 *   M11–M13 = "Missões detalhadas" 11 to 13,
 *   P1–P7   = the first 7 "problemas" of the second part of the file
 *             (their numbers come from the file's own references: "vira o problema 1" etc.).
 *
 * Kept from the file: stories, choices, chances, numbers and facts. Adapted: crew assignment,
 * durations, lasting conditions (only the 7 station resources), and 45-day mission days.
 * Corrected (checked against public sources): the CHAPEA popups. CHAPEA had a message delay of up
 * to 22 minutes each way, not two weeks with no contact at all.
 *
 * Links to problems of later batches are kept as flags only (e.g. 'harvest-delayed' for P8),
 * so nothing points to a mission that does not exist yet.
 */

/** One solar storm hits tomorrow (problem 4): extra station radiation for 1 day. */
function storm(dose: number): StationCondition {
  return { id: 'storm', label: `Solar storm: radiation +${dose} tomorrow`, daily: [{ resource: 'radiation', delta: dose }], days: 1 };
}

export const MISSIONS_BATCH_2: Mission[] = [
  // ─── P3: A despensa da missão — Day 1 ───
  {
    id: 'mission-pantry',
    sourceRef: 'P3',
    title: 'The Mission Pantry',
    description:
      'The station is being loaded before the trip. Bring more freeze-dried food (lasts longer, but needs water to prepare) or more ready-to-eat meals (tastier, but less of it)? This choice lasts the whole mission.',
    act: 1,
    day: 1,
    system: 'food',
    room: 'storage',
    icon: '📦',
    severity: 'normal',
    nasaSource: 'NASA space food research',
    factKind: 'tip',
    popup:
      'SPACE TIP: Freeze-dried space food is light and lasts a long time, but you must add water before eating it. For a trip to Mars, NASA wants food that stays good for about 5 years!',
    defer: false,
    choices: [
      {
        id: 'freeze-dried',
        label: 'More freeze-dried food',
        icon: '🥫',
        crew: { min: 1, max: 2 },
        time: '1 hour',
        fatigue: 0,
        effects: [],
        onSuccess: {
          addConditions: [
            { id: 'dry-food', label: 'Freeze-dried food needs water to prepare', daily: [{ resource: 'water', delta: -0.5 }], days: 15 },
          ],
        },
        narrative:
          '{crew} loaded freeze-dried food. The pantry is full! But every meal needs water, so for the next 15 days you will use a little more water every day.',
      },
      {
        id: 'ready-meals',
        label: 'More ready-to-eat meals',
        icon: '🍱',
        crew: { min: 1, max: 2 },
        time: '1 hour',
        fatigue: 0,
        effects: [
          { resource: 'food', delta: -20 },
          { resource: 'satisfaction', delta: 10 },
        ],
        narrative: '{crew} loaded ready meals. The crew cheered: they taste great! But there is less food, so plan your portions well.',
      },
    ],
  },

  // ─── P6: Quanto comer por dia — Day 2, comes back every 14 days ───
  {
    id: 'portion-size',
    sourceRef: 'P6',
    title: 'How Much Do We Eat?',
    description:
      'Food must last until the end of the mission. How big should the portions be for the next two weeks?',
    act: 1,
    day: 2,
    repeatEveryDays: 14,
    system: 'food',
    room: 'common',
    icon: '🍽',
    severity: 'normal',
    nasaSource: 'NASA space nutrition',
    factKind: 'tip',
    popup:
      'SPACE TIP: Astronauts need enough food to keep their bones and muscles strong. On long missions, NASA plans every meal so the food lasts the whole trip.',
    defer: false,
    choices: [
      {
        id: 'normal',
        label: 'Normal portions',
        icon: '🍛',
        crew: { min: 1, best: ['commander'] },
        time: '30 minutes',
        fatigue: 0,
        effects: [],
        onSuccess: { clearConditions: ['portions', 'portions-eva'] },
        narrative: 'Everyone eats normal portions. Food goes down 1 a day. If it reaches 0 before the end, it becomes a hunger crisis.',
      },
      {
        id: 'three-quarters',
        label: '3/4 portions',
        icon: '🥣',
        crew: { min: 1, best: ['commander'] },
        time: '30 minutes',
        fatigue: 0,
        effects: [],
        onSuccess: {
          clearConditions: ['portions-eva'],
          addConditions: [
            {
              id: 'portions',
              label: '3/4 portions: food lasts longer, crew a bit hungry',
              daily: [
                { resource: 'food', delta: 0.25 },
                { resource: 'satisfaction', delta: -1 },
              ],
              days: 14,
              successPenalty: 10,
            },
          ],
        },
        narrative: 'Smaller plates for two weeks. Food lasts longer, but the crew is a bit hungry and makes more mistakes.',
      },
      {
        id: 'half',
        label: 'Half portions',
        icon: '🥄',
        crew: { min: 1, best: ['commander'] },
        time: '30 minutes',
        fatigue: 0,
        effects: [],
        onSuccess: {
          clearConditions: ['portions-eva'],
          addConditions: [
            {
              id: 'portions',
              label: 'Half portions: hungry and weak crew',
              daily: [
                { resource: 'food', delta: 0.5 },
                { resource: 'health', delta: -1 },
                { resource: 'satisfaction', delta: -2 },
              ],
              days: 14,
              successPenalty: 25,
            },
          ],
        },
        narrative:
          'Half portions for two weeks. Food lasts much longer, but everyone is weak and grumpy. If health drops below 30, someone can get sick.',
      },
      {
        id: 'extra-for-eva',
        label: 'Extra food only for spacewalkers',
        icon: '🧑‍🚀',
        crew: { min: 1, best: ['commander'] },
        time: '30 minutes',
        fatigue: 0,
        effects: [{ resource: 'satisfaction', delta: -3 }],
        onSuccess: {
          clearConditions: ['portions'],
          addConditions: [
            {
              id: 'portions-eva',
              label: 'Extra food for spacewalkers (+10% on spacewalks)',
              daily: [{ resource: 'food', delta: -0.2 }],
              days: 14,
            },
          ],
        },
        narrative:
          'Whoever goes outside gets a bigger meal: spacewalks are 10% more likely to succeed. The others think it is a bit unfair.',
      },
    ],
  },

  // ─── P7: Horta na sombra — Day 6 (same shadow as "Mars Shadow Coming") ───
  {
    id: 'greenhouse-shadow',
    sourceRef: 'P7',
    title: 'Greenhouse in the Shadow',
    description:
      "The station will spend 3 days in Mars' shadow. The greenhouse lights use a lot of energy. What do we do with the plants?",
    act: 1,
    day: 6,
    system: 'food',
    room: 'greenhouse',
    icon: '🌱',
    severity: 'normal',
    nasaSource: 'NASA Veggie (ISS plant growth)',
    factKind: 'tip',
    popup:
      'SPACE TIP: On the ISS, plants grow in a small garden called Veggie under red, blue and green LED lights. In space, plants need light from lamps to grow.',
    defer: false,
    choices: [
      {
        id: 'keep-on',
        label: 'Keep the lights on all the time',
        icon: '💡',
        crew: { min: 1, best: ['scientist'] },
        time: '30 minutes',
        fatigue: 0,
        effects: [],
        onSuccess: {
          addConditions: [
            { id: 'shadow-lights', label: 'Greenhouse lights on in the shadow', daily: [{ resource: 'energy', delta: -10 }], days: 3 },
          ],
        },
        narrative: 'The plants stay 100% alive, but the lights use a lot of energy during the 3 days of shadow. Watch the Energy bar!',
      },
      {
        id: 'half-time',
        label: 'Lights on half the time',
        icon: '🌗',
        crew: { min: 1, best: ['scientist'] },
        time: '30 minutes',
        fatigue: 0,
        successRate: 80,
        noVerdict: true,
        effects: [],
        onSuccess: {
          setFlags: ['harvest-delayed'],
          addConditions: [
            { id: 'shadow-lights', label: 'Greenhouse lights on half the time', daily: [{ resource: 'energy', delta: -5 }], days: 3 },
          ],
        },
        narrative: 'The plants survived with less light! They grow slower now, so the first harvest will be 3 days late.',
        failEffects: [
          { resource: 'food', delta: -10 },
          { resource: 'satisfaction', delta: -5 },
        ],
        onFail: {
          setFlags: ['greenhouse-dead'],
          addConditions: [
            { id: 'shadow-lights', label: 'Greenhouse lights on half the time', daily: [{ resource: 'energy', delta: -5 }], days: 3 },
          ],
        },
        failNarrative: 'With too little light, the plants died. No fresh food from the greenhouse for now.',
      },
      {
        id: 'battery',
        label: 'Use the spare battery only for the greenhouse',
        icon: '🔋',
        crew: { min: 1, best: ['engineer'] },
        time: '2 hours',
        effects: [],
        // "A bateria envelhece mais rápido: o problema 33 aparece 10 dias antes" (day 20 instead of 30).
        onSuccess: { setFlags: ['battery-aging-early'], followUps: [{ missionId: 'battery-aged', afterDays: 14 }] },
        narrative:
          '{crew} connected the spare battery to the greenhouse. Energy stays the same and the plants are fine. But the battery will wear out faster.',
      },
      {
        id: 'lights-off',
        label: 'Turn the greenhouse off',
        icon: '🌑',
        crew: { min: 1 },
        time: '15 minutes',
        fatigue: 0,
        successRate: 3,
        noVerdict: true,
        effects: [],
        narrative: 'Amazing luck: the plants survived 3 days in the dark!',
        failEffects: [
          { resource: 'food', delta: -10 },
          { resource: 'satisfaction', delta: -5 },
        ],
        onFail: { setFlags: ['greenhouse-dead'] },
        failNarrative:
          'Each day in the dark made it harder for the plants (30%, then 60%, then 90% chance to die). They did not make it: no fresh food from the greenhouse.',
      },
    ],
  },

  // ─── P5: Comida antiga ou nova — every week from Day 9 ───
  {
    id: 'food-old-or-new',
    sourceRef: 'P5',
    title: 'Old Food or New Food?',
    description:
      'Food loses vitamins over time. Every week the Commander chooses what to eat first: the oldest packets or the newest ones?',
    act: 1,
    day: 9,
    repeatEveryDays: 7,
    system: 'food',
    room: 'storage',
    icon: '🥫',
    severity: 'normal',
    nasaSource: 'NASA space food research',
    factKind: 'tip',
    popup:
      'SPACE TIP: Some vitamins in stored food, like vitamin C, slowly break down over time. NASA scientists test how space food changes during long missions.',
    defer: false,
    choices: [
      {
        id: 'old-first',
        label: 'Eat the oldest food first',
        icon: '⏳',
        crew: { min: 1 },
        time: '30 minutes',
        fatigue: 0,
        effects: [],
        sideRisk: {
          chance: 10,
          effects: [
            { resource: 'food', delta: -3 },
            { resource: 'health', delta: -5 },
          ],
          text: 'Someone found a spoiled packet: food -3 and a sore tummy for whoever ate it.',
          unlessCondition: 'pantry-checked',
        },
        onSuccess: {
          counter: { id: 'old-food-weeks', reset: true },
          addConditions: [
            { id: 'diet-week', label: 'Eating old food (fewer vitamins)', daily: [{ resource: 'health', delta: -1 }], days: 7 },
          ],
        },
        narrative: 'Nothing is wasted. But old food has fewer vitamins, so health drops a little this week.',
      },
      {
        id: 'new-first',
        label: 'Eat the newest food first',
        icon: '🆕',
        crew: { min: 1 },
        time: '30 minutes',
        fatigue: 0,
        effects: [],
        sideRisk: {
          chance: 10,
          steps: { counter: 'old-food-weeks', chances: [10, 20, 35, 50] },
          effects: [{ resource: 'food', delta: -5 }],
          text: 'Some old packets in the back went bad and had to be thrown away: food -5.',
          unlessCondition: 'pantry-checked',
        },
        onSuccess: {
          counter: { id: 'old-food-weeks', add: 1 },
          addConditions: [
            { id: 'diet-week', label: 'Eating fresh food (more vitamins)', daily: [{ resource: 'health', delta: 1 }], days: 7 },
          ],
        },
        narrative: 'Fresh food, more vitamins: health goes up this week. But the old food keeps getting older, and each week it is more likely to spoil.',
      },
      {
        id: 'mix',
        label: 'Half old, half new',
        icon: '⚖️',
        crew: { min: 1 },
        time: '30 minutes',
        fatigue: 0,
        effects: [],
        sideRisk: {
          chance: 5,
          effects: [{ resource: 'food', delta: -3 }],
          text: 'One packet was spoiled: food -3.',
          unlessCondition: 'pantry-checked',
        },
        onSuccess: { clearConditions: ['diet-week'] },
        narrative: 'A balanced menu: health stays the same, and only a little food may spoil.',
      },
      {
        id: 'medic-check',
        label: 'Ask the medic to check the pantry',
        icon: '🩺',
        crew: { min: 1, max: 1, only: ['medic'] },
        time: 'Half a day',
        effects: [],
        onSuccess: {
          clearConditions: ['diet-week'],
          addConditions: [{ id: 'pantry-checked', label: 'Pantry checked by the medic: no spoiled food', daily: [], days: 14 }],
        },
        narrative: '{crew} checked every packet and sorted them by date. No packet will spoil for the next 2 weeks.',
      },
    ],
  },

  // ─── M11: Chuva de Destroços (ISS, 2021) — Day 14 ───
  {
    id: 'debris-storm',
    sourceRef: 'M11',
    sourceNumber: 11,
    title: 'Debris Storm!',
    description:
      'RED ALERT! A cloud of space debris (broken pieces of a satellite) is heading toward the station. Thousands of pieces, some as small as a marble, flying at 28,000 km/h. At that speed, even a tiny piece can punch through the wall. Arrival: 90 minutes.',
    act: 1,
    day: 14,
    system: 'oxygen',
    room: 'bridge',
    icon: '☄️',
    severity: 'critical',
    nasaSource: 'ISS debris alert',
    nasaYear: 2021,
    factKind: 'history',
    popup:
      'THIS REALLY HAPPENED! In November 2021, a missile test destroyed an old satellite and made more than 1,500 pieces of debris. The 7 people on the ISS had to shelter in their spacecraft (a SpaceX Dragon and a Soyuz) for about 2 hours. The head of NASA called the test irresponsible.',
    defer: false,
    choices: [
      {
        id: 'escape-pods',
        label: 'Everybody to the escape capsules',
        icon: '🚀',
        crew: { min: 4, everyone: true },
        time: '2 hours',
        fatigue: 0,
        effects: [{ resource: 'satisfaction', delta: -6 }],
        onSuccess: { setFlags: ['experiment-ruined'] },
        narrative:
          'Everyone waited inside the tiny capsules for 2 hours. The debris passed without hitting the station. All safe! But no work got done, and one science experiment was ruined because nobody could check on it.',
      },
      {
        id: 'shelter-core',
        label: 'Close the hatches, stay in the core',
        icon: '🛡️',
        crew: { min: 1, best: ['commander'] },
        time: '2 hours',
        fatigue: 0,
        successRate: 95,
        noVerdict: true,
        effects: [{ resource: 'satisfaction', delta: -2 }],
        narrative:
          '{crew} closed the doors between modules and the crew kept working in the best-shielded part of the station. The debris missed. Work went slower, but nothing was damaged.',
        failEffects: [
          { resource: 'oxygen', delta: -4 },
          { resource: 'energy', delta: -5 },
        ],
        failNarrative:
          'A small piece hit an outer module and some air leaked out of it. The hatch was closed, so the crew is fine, but some equipment in that module was lost.',
      },
      {
        id: 'move-station',
        label: 'Move the station',
        icon: '🧭',
        crew: { min: 1, best: ['scientist'] },
        time: '30 minutes of math',
        successRate: 90,
        effects: [{ resource: 'energy', delta: -5 }],
        narrative:
          '{crew} calculated a safe path and the thrusters fired. Perfect dodge! The thrusters used fuel and power, and you can not do this often.',
        failEffects: [{ resource: 'energy', delta: -10 }],
        failNarrative: 'The dodge was not quite enough. A small piece clipped a solar panel and energy dropped.',
      },
    ],
  },

  // ─── P4: A despensa vira escudo — Day 15 ───
  {
    id: 'pantry-shield',
    sourceRef: 'P4',
    title: 'Food as a Shield',
    description:
      'NASA DONKI warns: a solar storm will hit tomorrow! Bags of food can become walls around the storm shelter and block part of the radiation. How much food do we move?',
    act: 1,
    day: 15,
    system: 'radiation',
    room: 'storage',
    icon: '☀️',
    severity: 'normal',
    nasaSource: 'NASA DONKI / Orion storm shelter',
    factKind: 'tip',
    popup:
      'SPACE TIP: On NASA\'s Orion spacecraft, astronauts can build a storm shelter by packing supply bags around themselves. Food and water are full of hydrogen, which is good at blocking radiation from the Sun.',
    defer: false,
    choices: [
      {
        id: 'stack-all',
        label: 'Stack ALL the food around the shelter',
        icon: '🧱',
        crew: { min: 2, max: 4 },
        time: 'All day',
        noVerdict: true,
        successRate: 60,
        effects: [{ resource: 'satisfaction', delta: -5 }],
        sideRisk: { chance: 10, effects: [{ resource: 'food', delta: -5 }], text: 'Some food packets ripped during the move: food -5.' },
        onSuccess: { addConditions: [storm(2)] },
        onFail: { addConditions: [storm(4)] },
        narrative: '{crew} spent the day building a wall of food. The storm was weak, and the wall blocked 80% of it.',
        failNarrative: '{crew} spent the day building a wall of food. The storm was strong, but the wall still blocked 80% of it.',
      },
      {
        id: 'stack-half',
        label: 'Stack only half the food',
        icon: '🧺',
        crew: { min: 1, max: 2 },
        time: 'Half a day',
        noVerdict: true,
        successRate: 60,
        effects: [],
        sideRisk: { chance: 5, effects: [{ resource: 'food', delta: -3 }], text: 'A few food packets ripped: food -3.' },
        onSuccess: { addConditions: [storm(5)] },
        onFail: { addConditions: [storm(10)] },
        narrative: '{crew} built a smaller wall in half a day. The storm was weak, and the wall blocked half of it.',
        failNarrative: '{crew} built a smaller wall in half a day. The storm was strong; the wall blocked half of it.',
      },
      {
        id: 'food-and-water',
        label: 'Use food AND water bags',
        icon: '💧',
        crew: { min: 2, max: 4 },
        time: '1 and a half days',
        busyDays: 1,
        noVerdict: true,
        successRate: 60,
        effects: [{ resource: 'satisfaction', delta: -8 }],
        onSuccess: { addConditions: [storm(1)] },
        onFail: { addConditions: [storm(2)] },
        narrative: '{crew} built a thick wall of food and water bags. It blocks 90% of the storm! It took a day and a half of work.',
        failNarrative: 'The storm was strong, but the thick wall of food and water blocked 90% of it. It took a day and a half of work.',
      },
      {
        id: 'leave-it',
        label: 'Leave the pantry where it is',
        icon: '🤷',
        crew: { min: 1 },
        time: '10 minutes',
        fatigue: 0,
        noVerdict: true,
        successRate: 60,
        effects: [],
        onSuccess: { addConditions: [storm(10)] },
        onFail: {
          addConditions: [storm(20)],
          followUps: [{ missionId: 'crew-sick', afterDays: 1, afterDaysMax: 2, chance: 15 }],
        },
        narrative: 'No wall. Luckily the storm was weak: radiation goes up 10 tomorrow.',
        failNarrative: 'No wall, and the storm was strong: radiation goes up 20 tomorrow. Someone may feel sick after it.',
      },
    ],
  },

  // ─── M12: Silêncio Total (CHAPEA) — Day 23 ───
  {
    id: 'radio-silence',
    sourceRef: 'M12',
    sourceNumber: 12,
    title: 'Total Silence',
    description:
      "COMMUNICATION LOST. You can't reach Earth. No messages coming in, no messages going out. You don't know if the problem is on your side or on Earth's side. Last message from Earth: 18 hours ago. The crew is nervous.",
    act: 2,
    day: 23,
    system: 'energy',
    room: 'bridge',
    icon: '📡',
    severity: 'critical',
    nasaSource: 'NASA CHAPEA Mars simulation',
    nasaYear: 2024,
    factKind: 'simulation',
    popup:
      'NASA SIMULATION! In CHAPEA, 4 volunteers lived for 378 days (2023 to 2024) in a pretend Mars home in Houston. Messages to and from "Earth" took up to 22 minutes each way, like on a real Mars trip, so the crew had to solve many problems on their own.',
    defer: false,
    choices: [
      {
        id: 'stay-calm',
        label: 'Stay calm, keep the routine',
        icon: '🧘',
        crew: { min: 1, best: ['commander'] },
        time: '1 hour',
        fatigue: 0,
        effects: [
          { resource: 'satisfaction', delta: -10 },
          { resource: 'radiation', delta: 3 },
        ],
        onSuccess: {
          addConditions: [{ id: 'no-earth-contact', label: 'No contact with Earth', daily: [], days: 2 }],
        },
        narrative:
          '{crew} kept everyone busy with normal work, which helps with worry. Contact came back 2 days later. You missed a warning about a small solar storm, but luckily it was weak.',
      },
      {
        id: 'boost-antenna',
        label: 'Boost the antenna',
        icon: '📶',
        crew: { min: 1, best: ['engineer'] },
        time: '3 hours',
        successRate: 70,
        effects: [
          { resource: 'energy', delta: -8 },
          { resource: 'satisfaction', delta: 3 },
        ],
        narrative:
          '{crew} sent extra power to the antenna and reached Earth! A small problem on Earth\'s side caused the silence. Everything is fine.',
        failEffects: [
          { resource: 'energy', delta: -8 },
          { resource: 'oxygen', delta: -3 },
          { resource: 'satisfaction', delta: -4 },
        ],
        onFail: {
          addConditions: [{ id: 'no-earth-contact', label: 'No contact with Earth', daily: [], days: 2 }],
        },
        failNarrative:
          'Still no contact. The extra power came from the oxygen machine and the heater, so the station was colder and made less oxygen today.',
      },
      {
        id: 'emergency-protocol',
        label: 'Emergency protocol',
        icon: '🚨',
        crew: { min: 4, everyone: true },
        time: 'All day',
        fatigue: 0,
        effects: [
          { resource: 'energy', delta: -5 },
          { resource: 'satisfaction', delta: -15 },
        ],
        onSuccess: {
          addConditions: [
            { id: 'rattled', label: 'The crew is rattled: everyone works slower', daily: [], days: 1, successPenalty: 10 },
          ],
        },
        narrative:
          'Everyone moved to the shielded area and turned off everything not needed. It was just a technical problem. Very safe, but a whole day of work was lost and the crew is scared and works slower tomorrow.',
      },
    ],
  },

  // ─── M13: Comida Acabando (CHAPEA) — Day 30 ───
  {
    id: 'food-running-low',
    sourceRef: 'M13',
    sourceNumber: 13,
    title: 'Food Running Low',
    description:
      'WARNING: The packed meals are going faster than planned. There is food for about 12 more days, but the mission lasts longer. The greenhouse feeds only 1 person per day, and no supply ship is coming.',
    act: 2,
    day: 30,
    system: 'food',
    room: 'storage',
    icon: '🍽',
    severity: 'normal',
    nasaSource: 'NASA CHAPEA / Human Research Program',
    nasaYear: 2024,
    factKind: 'simulation',
    popup:
      'NASA SIMULATION! In CHAPEA, the crew ate shelf-stable space food and grew some fresh vegetables. NASA studies food closely, because not having enough good food is one of the health risks of a long trip to Mars, where no supply ship can come.',
    defer: {
      effects: [
        { resource: 'food', delta: -2 },
        { resource: 'satisfaction', delta: -3 },
      ],
      text: 'Another day of eating as usual: the food runs out faster.',
    },
    choices: [
      {
        id: 'cut-rations',
        label: 'Cut rations for everyone (3/4)',
        icon: '🥣',
        crew: { min: 1, best: ['commander'] },
        time: '30 minutes',
        fatigue: 0,
        effects: [{ resource: 'satisfaction', delta: -10 }],
        onSuccess: {
          addConditions: [
            {
              id: 'portions',
              label: 'Rations cut: hungry, slower crew',
              daily: [
                { resource: 'food', delta: 0.25 },
                { resource: 'health', delta: -0.5 },
              ],
              days: 10,
              successPenalty: 15,
            },
          ],
          followUps: [{ missionId: 'crew-sick', afterDays: 8, afterDaysMax: 10, chance: 30 }],
        },
        narrative:
          'Everyone eats 3/4 of a normal meal. The food will last. But the crew is hungry, gets tired faster and works slower. If this goes on too long, people start getting sick.',
      },
      {
        id: 'power-greenhouse',
        label: 'Power up the greenhouse',
        icon: '🍅',
        crew: { min: 1, best: ['scientist'] },
        time: '3 hours',
        effects: [
          { resource: 'energy', delta: -5 },
          { resource: 'satisfaction', delta: 5 },
        ],
        onSuccess: {
          addConditions: [
            {
              id: 'greenhouse-boost',
              label: 'Greenhouse on 20 hours a day',
              daily: [
                { resource: 'food', delta: 0.5 },
                { resource: 'energy', delta: -1 },
                { resource: 'oxygen', delta: -0.5 },
              ],
              days: 10,
            },
          ],
        },
        narrative:
          '{crew} set the LED lights to 20 hours a day and gave the plants more water. They now feed 2 people a day, and fresh tomatoes and lettuce cheer everyone up! But the extra water was water for the oxygen machine, and the lights use energy.',
      },
      {
        id: 'eat-science',
        label: 'Eat the science plants',
        icon: '🥬',
        crew: { min: 1, best: ['scientist'] },
        time: '1 hour',
        fatigue: 0,
        effects: [
          { resource: 'food', delta: 8 },
          { resource: 'satisfaction', delta: 8 },
        ],
        onSuccess: { setFlags: ['science-lost'] },
        narrative:
          'The crew ate the plants that were grown for research. Full bellies for 3 days and happier faces! But the experiment is gone, and its science data is lost.',
      },
    ],
  },

  // ════════════════ Sickness (P1, P2): set off by other choices, low health, or catching it ════════════════

  // ─── P1: Tripulante doente ───
  {
    id: 'crew-sick',
    sourceRef: 'P1',
    followUpOnly: true,
    repeatable: true,
    patient: true,
    title: 'A Crew Member Is Sick',
    description:
      '{patient} has a fever and feels very weak. How should {patient} get better? A medic doubles the chance of getting better each day (also when the medic is the one who is sick).',
    act: 1,
    system: 'health',
    room: 'quarters',
    icon: '🤒',
    severity: 'normal',
    nasaSource: 'ISS crew medical care',
    factKind: 'tip',
    popup:
      'SPACE TIP: Before launch, astronauts spend about 2 weeks in quarantine so they do not take germs to space. On the station, one crew member is trained as the medical officer, and doctors on Earth help by radio.',
    defer: {
      effects: [
        { resource: 'health', delta: -2 },
        { resource: 'satisfaction', delta: -2 },
      ],
      text: '{patient} stays in bed without a plan for one more day.',
    },
    choices: [
      {
        id: 'rest-with-care',
        label: 'Rest, with someone taking care',
        icon: '🛏️',
        crew: { min: 1, max: 1, best: ['medic'] },
        time: 'Until better',
        fatigue: 0,
        effects: [],
        onSuccess: { illness: 'rest' },
        narrative:
          '{patient} rests while {crew} takes care. This is the fastest way to get better (45%, 70%, 90%, then 100% each day). But the others must do extra work, and the sickness can spread a little.',
      },
      {
        id: 'isolation',
        label: 'Isolation',
        icon: '🚪',
        crew: { min: 1, max: 1, best: ['medic'] },
        time: '1 hour',
        effects: [],
        onSuccess: { illness: 'isolation' },
        narrative:
          '{crew} set up a quiet, closed room for {patient}. Nobody else can catch it, but getting better takes longer (25%, 50%, 70%, 90%, 100%).',
      },
      {
        id: 'keep-working',
        label: 'Keep working (emergency)',
        icon: '💪',
        crew: { min: 0 },
        time: 'Every day',
        fatigue: 0,
        effects: [{ resource: 'satisfaction', delta: -2 }],
        onSuccess: { illness: 'working' },
        narrative:
          '{patient} keeps working while sick. Nobody has to stop their job, but getting better is slow, the sickness spreads easily, and {patient} may get much worse.',
      },
    ],
  },

  // ─── P2: Tripulante terrivelmente doente ───
  {
    id: 'crew-very-sick',
    sourceRef: 'P2',
    followUpOnly: true,
    repeatable: true,
    patient: true,
    title: 'Very Sick!',
    description:
      '{patient} is terribly sick and needs someone by their side all the time. While sick, {patient} needs extra oxygen, water and food. With the medic caring, it takes 3 days; with someone else, 5 days.',
    act: 1,
    system: 'health',
    room: 'quarters',
    icon: '🚑',
    severity: 'critical',
    nasaSource: 'ISS crew medical care',
    factKind: 'tip',
    popup:
      'SPACE TIP: The ISS has a medical kit with medicines and tools, and doctors on Earth can see the crew on video. On the way to Mars, messages take many minutes, so the crew must be able to care for each other.',
    defer: false,
    choices: [
      {
        id: 'medic-cares',
        label: 'The medic takes care',
        icon: '🩺',
        crew: { min: 1, max: 1, only: ['medic'] },
        time: '3 days',
        fatigue: 1,
        effects: [],
        onSuccess: { illness: 'severe' },
        narrative: '{crew} will stay with {patient} day and night. With good medical care, {patient} should be well in 3 days.',
      },
      {
        id: 'someone-cares',
        label: 'Someone else takes care',
        icon: '🤝',
        crew: { min: 1, max: 1 },
        time: '5 days',
        fatigue: 1,
        effects: [],
        onSuccess: { illness: 'severe' },
        narrative: '{crew} will stay with {patient} and follow the medical checklist. It will take about 5 days.',
      },
    ],
  },
];
