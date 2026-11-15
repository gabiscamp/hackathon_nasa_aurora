import type { Mission, StationCondition } from './missions';

/**
 * Batch 4 of the team's missoes.txt: problems P18 to P27 (water, and the first energy problem).
 * P18 follows the team's notes in the file: tell how pee and sweat are cleaned until they are
 * drinkable again, explain the repair in simple words, and remind the player to check the bars.
 * P27 can come back with every Mars shadow (P28, next batch, decides the power plant).
 */

function storm(dose: number): StationCondition {
  return { id: 'storm', label: `Solar storm: radiation +${dose} tomorrow`, daily: [{ resource: 'radiation', delta: dose }], days: 1 };
}

export const MISSIONS_BATCH_4: Mission[] = [
  // ─── P27: A sombra de Marte está chegando — Day 6 (with P7, the same shadow) ───
  {
    id: 'mars-shadow',
    sourceRef: 'P27',
    repeatable: true,
    title: "Mars' Shadow Is Coming",
    description:
      "The station is about to pass into Mars' shadow. No sunlight means the solar panels make no power, and the battery can't run everything. What do we turn off?",
    act: 1,
    day: 6,
    system: 'energy',
    room: 'bridge',
    icon: '🌑',
    severity: 'normal',
    nasaSource: 'ESA Mars Express eclipse season',
    nasaYear: 2006,
    factKind: 'history',
    popup:
      'THIS REALLY HAPPENED! In 2006, the Mars Express spacecraft faced long eclipses: Mars blocked the Sun for up to 90 minutes each orbit. Engineers turned off instruments and heaters one by one so the battery would last.',
    defer: false,
    choices: [
      {
        id: 'lab-off',
        label: 'Turn off the lab',
        icon: '🔬',
        crew: { min: 1, best: ['scientist'] },
        time: '30 minutes',
        fatigue: 0,
        effects: [{ resource: 'energy', delta: 10 }],
        onSuccess: { setFlags: ['science-paused'] },
        narrative: '{crew} shut down the lab. Energy saved! But no science today.',
      },
      {
        id: 'greenhouse-off',
        label: 'Turn off the greenhouse',
        icon: '🌱',
        crew: { min: 1 },
        time: '30 minutes',
        fatigue: 0,
        effects: [
          { resource: 'energy', delta: 5 },
          { resource: 'food', delta: -5 },
          { resource: 'satisfaction', delta: -3 },
        ],
        narrative: '{crew} turned off the greenhouse lights. A little energy saved, but the plants grow less.',
      },
      {
        id: 'heating-down',
        label: 'Lower the heating',
        icon: '🥶',
        crew: { min: 1, best: ['engineer'] },
        time: '30 minutes',
        fatigue: 0,
        effects: [
          { resource: 'energy', delta: 10 },
          { resource: 'satisfaction', delta: -5 },
          { resource: 'health', delta: -3 },
        ],
        narrative: '{crew} turned the heaters down. Lots of energy saved, but everyone is cold, grumpy and sniffly.',
      },
    ],
  },

  // ─── P19: Banho hoje — every 5 days from Day 4 ───
  {
    id: 'bath-day',
    sourceRef: 'P19',
    title: 'Bath Time',
    description: 'After a heavy day, the crew wants to get clean. There is no shower in space: a wet towel uses water. Wash, or skip it?',
    act: 1,
    day: 4,
    repeatEveryDays: 5,
    system: 'water',
    room: 'bathroom',
    icon: '🧼',
    severity: 'normal',
    nasaSource: 'ISS hygiene',
    factKind: 'tip',
    popup:
      'SPACE TIP: Astronauts on the ISS clean themselves with wet towels and no-rinse shampoo. Water would float around in blobs, so a real shower is not possible!',
    defer: false,
    choices: [
      {
        id: 'towel-bath',
        label: 'Wet towel bath for everyone',
        icon: '🧽',
        crew: { min: 1 },
        time: '1 hour',
        fatigue: 0,
        effects: [
          { resource: 'satisfaction', delta: 5 },
          { resource: 'water', delta: -3 },
        ],
        onSuccess: { counter: { id: 'skipped-baths', reset: true } },
        narrative: 'Everyone feels fresh and clean!',
      },
      {
        id: 'skip',
        label: 'Skip the bath',
        icon: '🚫',
        crew: { min: 1 },
        time: '5 minutes',
        fatigue: 0,
        effects: [
          { resource: 'satisfaction', delta: -5 },
          { resource: 'health', delta: -2 },
        ],
        onSuccess: {
          counter: { id: 'skipped-baths', add: 1 },
          followUps: [{ missionId: 'crew-sick', afterDays: 1, chance: 25, requiresCounter: { id: 'skipped-baths', atLeast: 3 } }],
        },
        narrative: 'Water saved, but the crew feels sticky. Skipping too many times in a row can make someone sick.',
      },
    ],
  },

  // ─── P18: O reciclador de urina quebrou — Day 19 ───
  {
    id: 'urine-recycler',
    sourceRef: 'P18',
    title: 'The Pee Recycler Stopped',
    description:
      'The machine that turns pee back into water has stopped. On a space station, pee and sweat are not wasted: they are boiled, filtered and cleaned so well that they become clean drinking water again. Without the recycler, that water is lost. Look at your Water and Energy bars before you choose.',
    act: 2,
    day: 19,
    system: 'water',
    room: 'bathroom',
    icon: '♻️',
    severity: 'normal',
    nasaSource: 'ISS Urine Processor Assembly',
    nasaYear: 2009,
    factKind: 'history',
    popup:
      'THIS REALLY HAPPENED! The ISS urine processor broke soon after it started in 2008-2009, and new parts had to be flown up. When it works, the station recovers about 98% of its water, including pee and sweat. "Today\'s coffee is tomorrow\'s coffee," astronauts joke!',
    defer: { effects: [{ resource: 'water', delta: -3 }], text: 'One more day of losing water.' },
    choices: [
      {
        id: 'fix-now',
        label: 'Fix it now (open it up, clean the boiler, change the filters)',
        icon: '🔧',
        crew: { min: 2, max: 3, best: ['engineer'] },
        time: 'All day',
        fatigue: 2,
        effects: [{ resource: 'energy', delta: -10 }],
        narrative:
          '{crew} opened the recycler. The part that boils the pee (to separate clean water vapor) was clogged with minerals. They cleaned it, put in new filters, and tested the water: clean again! No other work got done today.',
      },
      {
        id: 'backup-bags',
        label: 'Use the backup bags',
        icon: '🛍️',
        crew: { min: 1 },
        time: '30 minutes',
        fatigue: 0,
        temporary: true,
        effects: [],
        onSuccess: {
          addConditions: [
            {
              id: 'urine-bags',
              label: 'Pee recycler off: using backup bags',
              daily: [
                { resource: 'water', delta: -3 },
                { resource: 'satisfaction', delta: -2 },
              ],
              days: 5,
            },
          ],
          followUps: [{ missionId: 'bags-run-out', afterDays: 5 }],
        },
        narrative: 'The crew uses backup bags. Work goes on, but that water is lost every day, and there are only enough bags for 5 days.',
      },
    ],
  },

  // ─── P20: A água está sumindo devagar — Day 25 ───
  {
    id: 'water-slowly-lost',
    sourceRef: 'P20',
    title: 'Water Slowly Disappearing',
    description: 'A little water is lost every time it is recycled. Turn on the brine processor to squeeze more water out of what is left?',
    act: 2,
    day: 25,
    system: 'water',
    room: 'engineering',
    icon: '💧',
    severity: 'normal',
    nasaSource: 'ISS Brine Processor Assembly',
    nasaYear: 2021,
    factKind: 'history',
    popup:
      'THIS REALLY HAPPENED! In 2021, NASA added a Brine Processor to the ISS. It squeezes extra water out of the salty leftovers from recycling pee, helping the station reach about 98% water recovery.',
    defer: false,
    choices: [
      {
        id: 'brine-on',
        label: 'Turn on the brine processor',
        icon: '⚙️',
        crew: { min: 1, best: ['engineer'] },
        time: '2 hours',
        effects: [],
        onSuccess: {
          addConditions: [
            {
              id: 'brine-processor',
              label: 'Brine processor on: less water lost, more energy used',
              daily: [
                { resource: 'water', delta: 0.5 },
                { resource: 'energy', delta: -2 },
              ],
            },
          ],
        },
        narrative: '{crew} turned on the brine processor. Water now drops half as fast, but it uses energy every day.',
      },
      {
        id: 'leave-it',
        label: 'Leave it as it is',
        icon: '🤷',
        crew: { min: 1 },
        time: '5 minutes',
        fatigue: 0,
        effects: [],
        narrative: 'Nothing changes. Water keeps dropping a little every day.',
      },
    ],
  },

  // ─── P24: Vazamento na sala de máquinas — Day 26 ───
  {
    id: 'pipe-leak',
    sourceRef: 'P24',
    title: 'Leak in the Machine Room',
    description: 'A recycling pipe in the Life Support Node is dripping. Tiny water drops are floating around the machines.',
    act: 2,
    day: 26,
    system: 'water',
    room: 'engineering',
    icon: '🚰',
    severity: 'normal',
    nasaSource: 'ISS water system',
    factKind: 'tip',
    popup:
      'SPACE TIP: In space, leaking water does not fall to the floor. It forms floating blobs that can get into electronics, so every leak is taken seriously.',
    defer: { effects: [{ resource: 'water', delta: -1 }], text: 'The pipe keeps dripping.' },
    choices: [
      {
        id: 'close-and-fix',
        label: 'Close the valve and fix it',
        icon: '🔧',
        crew: { min: 1, best: ['engineer'] },
        time: '3 hours',
        effects: [
          { resource: 'water', delta: -5 },
          { resource: 'energy', delta: -5 },
        ],
        onSuccess: { setFlags: ['pipe-fixed'] },
        narrative: '{crew} closed the valve, dried the machines and replaced the pipe. Fixed for good.',
      },
      {
        id: 'just-dry',
        label: 'Just dry it and carry on',
        icon: '🧻',
        crew: { min: 1 },
        time: '30 minutes',
        fatigue: 0,
        temporary: true,
        effects: [],
        onSuccess: {
          addConditions: [{ id: 'dripping-pipe', label: 'Dripping pipe', daily: [{ resource: 'water', delta: -1 }], days: 7 }],
          delayed: [
            {
              afterDays: 7,
              effects: [
                { resource: 'water', delta: -15 },
                { resource: 'energy', delta: -5 },
              ],
              text: 'BANG! The dripping pipe burst: water -15, energy -5.',
              unlessFlag: 'pipe-fixed',
            },
          ],
          followUps: [{ missionId: 'pipe-burst', afterDays: 7, unlessFlag: 'pipe-fixed' }],
        },
        narrative: '{crew} wiped up the drops. The pipe keeps dripping, and in about a week it may burst.',
      },
    ],
  },

  // ─── P21: A horta está com sede — Day 27 ───
  {
    id: 'thirsty-greenhouse',
    sourceRef: 'P21',
    title: 'The Plants Are Thirsty',
    description: 'The greenhouse plants need more water to keep growing.',
    act: 2,
    day: 27,
    skipIfFlag: 'greenhouse-dead',
    system: 'food',
    room: 'greenhouse',
    icon: '🪴',
    severity: 'normal',
    nasaSource: 'NASA Veggie (ISS plant growth)',
    factKind: 'tip',
    popup:
      'SPACE TIP: In space, water does not soak down into the soil. Space gardens use special "pillows" with wicks that bring water to the roots.',
    defer: false,
    choices: [
      {
        id: 'water-normally',
        label: 'Water them normally',
        icon: '🚿',
        crew: { min: 1, best: ['scientist'] },
        time: '30 minutes',
        fatigue: 0,
        effects: [{ resource: 'water', delta: -3 }],
        onSuccess: { delayed: [{ afterDays: 10, effects: [{ resource: 'food', delta: 10 }], text: 'The well-watered plants gave a good harvest: food +10!' }] },
        narrative: '{crew} watered the plants well. In 10 days: a good harvest.',
      },
      {
        id: 'water-less',
        label: 'Give them less water',
        icon: '💧',
        crew: { min: 1 },
        time: '15 minutes',
        fatigue: 0,
        effects: [],
        onSuccess: { delayed: [{ afterDays: 10, effects: [{ resource: 'food', delta: 4 }], text: 'The thirsty plants gave a small harvest: food +4.' }] },
        narrative: 'Water saved. The plants will still grow, but less.',
      },
    ],
  },

  // ─── P22: Alerta de contaminação — Day 33 (or earlier, from trash kept in a module) ───
  {
    id: 'contamination-alert',
    sourceRef: 'P22',
    title: 'Contamination Alert',
    description: 'The water purity sensor just gave an alert. Something might be wrong with the water.',
    act: 3,
    day: 33,
    system: 'water',
    room: 'engineering',
    icon: '🧪',
    severity: 'critical',
    nasaSource: 'ISS water quality monitoring',
    factKind: 'tip',
    popup:
      'SPACE TIP: The ISS tests its drinking water all the time. If bacteria or chemicals show up, the crew stops using that water and changes filters before anyone drinks it.',
    defer: false,
    choices: [
      {
        id: 'change-filters',
        label: 'Stop and change the filters',
        icon: '🔄',
        crew: { min: 1, best: ['engineer'] },
        time: '1 day without recycled water',
        effects: [
          { resource: 'energy', delta: -5 },
          { resource: 'satisfaction', delta: -5 },
        ],
        narrative: '{crew} stopped the water system and put in new filters. One day without recycled water, but now it is safe.',
      },
      {
        id: 'keep-using',
        label: 'Keep using the water',
        icon: '🤞',
        crew: { min: 1 },
        time: '5 minutes',
        fatigue: 0,
        effects: [],
        onSuccess: { followUps: [{ missionId: 'crew-sick', afterDays: 1, afterDaysMax: 3, chance: 30 }] },
        narrative: 'You kept using the water. Maybe the sensor was wrong... or maybe someone will get sick in the next days.',
      },
    ],
  },

  // ─── P25: Banheiro entupido — Day 35 ───
  {
    id: 'toilet-clogged',
    sourceRef: 'P25',
    title: 'The Toilet Is Clogged',
    description: 'The toilet is part of the water recycling system, and now it is clogged.',
    act: 3,
    day: 35,
    system: 'water',
    room: 'bathroom',
    icon: '🚽',
    severity: 'normal',
    nasaSource: 'ISS toilet',
    factKind: 'tip',
    popup:
      'SPACE TIP: In 2020, NASA sent a new toilet to the ISS called the Universal Waste Management System. It is smaller, lighter and easier to use than the old one.',
    defer: { effects: [{ resource: 'satisfaction', delta: -5 }], text: 'One more day without a toilet.' },
    choices: [
      {
        id: 'fix',
        label: 'Fix it',
        icon: '🔧',
        crew: { min: 1, best: ['engineer'] },
        time: 'All day',
        fatigue: 2,
        effects: [{ resource: 'energy', delta: -3 }],
        narrative: '{crew} spent the day unclogging the toilet. Not fun, but done!',
      },
      {
        id: 'emergency-bags',
        label: 'Use emergency bags',
        icon: '🛍️',
        crew: { min: 1 },
        time: '30 minutes',
        fatigue: 0,
        temporary: true,
        effects: [],
        onSuccess: {
          addConditions: [
            {
              id: 'toilet-bags',
              label: 'Toilet clogged: emergency bags',
              daily: [
                { resource: 'satisfaction', delta: -5 },
                { resource: 'water', delta: -1 },
              ],
              days: 3,
            },
          ],
          setFlags: ['bad-morale-days'],
          followUps: [{ missionId: 'toilet-fix', afterDays: 3 }],
        },
        narrative: 'Emergency bags for now. After 3 days, the crew will really want the toilet back.',
      },
    ],
  },

  // ─── P23: Água como escudo — Day 37 ───
  {
    id: 'water-shield',
    sourceRef: 'P23',
    title: 'Water as a Shield',
    description: 'A solar storm arrives tomorrow! Water bags around the shelter can block part of the radiation.',
    act: 3,
    day: 37,
    system: 'radiation',
    room: 'storage',
    icon: '🛡️',
    severity: 'normal',
    nasaSource: 'NASA DONKI / radiation shielding',
    factKind: 'tip',
    popup:
      'SPACE TIP: Water is one of the best shields against space radiation, because it is full of hydrogen. Future Mars ships may put water tanks around the crew cabins.',
    defer: false,
    choices: [
      {
        id: 'water-to-shelter',
        label: 'Take the water to the shelter',
        icon: '💧',
        crew: { min: 2, max: 3 },
        time: 'Half a day',
        noVerdict: true,
        successRate: 60,
        effects: [{ resource: 'satisfaction', delta: -5 }],
        onSuccess: { addConditions: [storm(4)] },
        onFail: { addConditions: [storm(8)] },
        narrative: '{crew} moved the water bags around the shelter. The storm was weak, and the water blocked 60% of it.',
        failNarrative: '{crew} moved the water bags around the shelter. The storm was strong, but the water still blocked 60% of it.',
      },
      {
        id: 'leave-water',
        label: 'Leave the water where it is',
        icon: '🤷',
        crew: { min: 1 },
        time: '5 minutes',
        fatigue: 0,
        noVerdict: true,
        successRate: 60,
        effects: [],
        onSuccess: { addConditions: [storm(10)] },
        onFail: { addConditions: [storm(20)] },
        narrative: 'No extra shield. Luckily the storm was weak: radiation +10 tomorrow.',
        failNarrative: 'No extra shield, and the storm was strong: radiation +20 tomorrow.',
      },
    ],
  },

  // ─── P26: Racionar água — when water drops below 40 ───
  {
    id: 'water-rationing',
    sourceRef: 'P26',
    followUpOnly: true,
    trigger: { resource: 'water', below: 40, fromDay: 3 },
    title: 'Ration the Water?',
    description: 'Water has dropped below 40. Should everyone use less water from now on?',
    act: 2,
    system: 'water',
    room: 'engineering',
    icon: '🚱',
    severity: 'normal',
    nasaSource: 'ISS water budget',
    factKind: 'tip',
    popup:
      'SPACE TIP: Each astronaut uses only a few liters of water a day on the ISS, for drinking, food and washing. On Earth, one shower can use more than 50 liters!',
    defer: false,
    choices: [
      {
        id: 'ration',
        label: 'Ration the water',
        icon: '🥤',
        crew: { min: 1, best: ['commander'] },
        time: '30 minutes',
        fatigue: 0,
        effects: [],
        onSuccess: {
          addConditions: [
            {
              id: 'water-ration',
              label: 'Water rationing: thirsty crew',
              daily: [
                { resource: 'water', delta: 0.5 },
                { resource: 'satisfaction', delta: -2 },
                { resource: 'health', delta: -1 },
              ],
              days: 10,
            },
          ],
          followUps: [{ missionId: 'crew-sick', afterDays: 10, chance: 40 }],
        },
        narrative: 'Everyone uses less water. Water now drops half as fast, but the crew is thirsty and a bit weaker each day.',
      },
      {
        id: 'normal-use',
        label: 'Keep using water normally',
        icon: '🚿',
        crew: { min: 1 },
        time: '5 minutes',
        fatigue: 0,
        effects: [],
        narrative: 'Nothing changes. Keep an eye on the Water bar!',
      },
    ],
  },

  // ════════════════ Follow-ups ════════════════
  {
    id: 'bags-run-out',
    followUpOnly: true,
    title: 'The Backup Bags Ran Out',
    description: 'No more backup bags! Now water is lost even faster. The pee recycler must be fixed.',
    act: 2,
    system: 'water',
    room: 'bathroom',
    icon: '♻️',
    severity: 'critical',
    nasaSource: 'ISS Urine Processor Assembly',
    factKind: 'tip',
    popup:
      'SPACE TIP: The pee recycler boils pee at low pressure, so it boils at a lower temperature. The clean steam is cooled back into water, and the salty leftovers stay behind.',
    defer: { effects: [{ resource: 'water', delta: -5 }], text: 'Another day without bags: water -5.' },
    choices: [
      {
        id: 'fix-now',
        label: 'Fix the recycler now',
        icon: '🔧',
        crew: { min: 2, max: 3, best: ['engineer'] },
        time: 'All day',
        fatigue: 2,
        effects: [{ resource: 'energy', delta: -10 }],
        onSuccess: { clearConditions: ['urine-bags'] },
        narrative: '{crew} cleaned the boiler and changed the filters. The recycler makes clean water again!',
      },
    ],
  },

  {
    id: 'pipe-burst',
    followUpOnly: true,
    title: 'The Pipe Burst!',
    description: 'The dripping pipe finally burst. Water is floating everywhere in the Life Support Node!',
    act: 2,
    system: 'water',
    room: 'engineering',
    icon: '💦',
    severity: 'critical',
    nasaSource: 'ISS water system',
    factKind: 'tip',
    popup: 'SPACE TIP: Astronauts catch floating water with towels and special vacuum cleaners, before it reaches any electronics.',
    defer: false,
    choices: [
      {
        id: 'replace-pipe',
        label: 'Replace the pipe',
        icon: '🔧',
        crew: { min: 1, max: 2, best: ['engineer'] },
        time: 'All day',
        fatigue: 2,
        effects: [{ resource: 'energy', delta: -3 }],
        onSuccess: { setFlags: ['pipe-fixed'], clearConditions: ['dripping-pipe'] },
        narrative: '{crew} caught the floating water and put in a new pipe. Fixed for good this time!',
      },
    ],
  },
];
