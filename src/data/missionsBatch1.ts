import type { Mission } from './missions';

/**
 * Mission days follow the 45-day mission (src/data/missionLength.ts).
 *
 * Batch 1 of the team's missoes.txt: "Missoes detalhadas" 1 to 10.
 *
 * Kept from the file: the stories, real events, choices, chances and the facts in the popups.
 * Added: who goes (crew), how long they are busy, improvised fixes that can fail later,
 * and chained consequences (follow-up missions and lasting station conditions).
 * Only the 7 station resources change; candles, flags and conditions are internal states.
 *
 * Rooms follow the team's room guide (missoes.txt, "Dicas para identificar os comodos"):
 * a problem inside a room goes to that room; repairs outside the station go to the airlock.
 *
 * Narratives may use {crew}: the first names of the crew members who were sent.
 *
 * Follow-up missions (followUpOnly) live at the end of this file. They never schedule
 * themselves, so a chain always ends.
 */

const SPACEWALK = 'Spacewalk';

export const MISSIONS_BATCH_1: Mission[] = [
  // ─── Missão 7: O Banheiro Quebrou (ISS, 2008) — Day 5, calm start ───
  {
    id: 'bathroom-broke',
    sourceNumber: 7,
    title: 'The Bathroom Broke',
    description:
      "Uh oh! The toilet and the water recycler broke down. In space, the toilet doesn't just flush: it is a machine that also cleans pee and sweat back into drinking water. Without it, you lose water every time someone uses the bathroom.",
    act: 1,
    day: 3,
    system: 'water',
    room: 'bathroom',
    icon: '🚽',
    severity: 'normal',
    nasaSource: 'ISS toilet and Water Recovery System',
    nasaYear: 2008,
    factKind: 'history',
    popup:
      "THIS REALLY HAPPENED! The ISS toilet has broken many times. In 2008, NASA had to send repair parts on the next Space Shuttle flight. The station's recycler cleans pee and sweat so well that it becomes drinking water again. That water is also used to make oxygen!",
    defer: {
      effects: [
        { resource: 'water', delta: -3 },
        { resource: 'satisfaction', delta: -8 },
      ],
      text: 'One more day with a broken toilet: water is lost and the crew is grumpy.',
    },
    choices: [
      {
        id: 'full-repair',
        label: 'Engineer fixes it today',
        icon: '🔧',
        crew: { min: 1, max: 2, best: ['engineer'] },
        time: 'All day',
        fatigue: 2,
        effects: [{ resource: 'energy', delta: -5 }],
        narrative:
          '{crew} spent the whole day on the toilet system. By the evening the toilet and the water recycler work again. But nothing else got fixed today.',
      },
      {
        id: 'use-bags',
        label: 'Use emergency bags until tomorrow',
        icon: '🛍️',
        crew: { min: 1 },
        time: '1 hour',
        effects: [
          { resource: 'satisfaction', delta: -12 },
          { resource: 'water', delta: -2 },
        ],
        onSuccess: { followUps: [{ missionId: 'toilet-fix', afterDays: 1 }] },
        narrative:
          '{crew} handed out emergency waste bags, like astronauts used in the old days. It works, but nobody is happy. The pee in the bags cannot be recycled, so that water is lost forever. The toilet must be fixed tomorrow.',
      },
      {
        id: 'partial-fix',
        label: 'Quick partial fix',
        icon: '⚡',
        crew: { min: 1, best: ['engineer'] },
        time: '3 hours',
        temporary: true,
        effects: [{ resource: 'energy', delta: -2 }],
        onSuccess: {
          addConditions: [
            {
              id: 'recycler-off',
              label: 'Water recycler broken: water is not being recycled',
              daily: [
                { resource: 'water', delta: -1 },
                { resource: 'oxygen', delta: -0.3 },
              ],
            },
          ],
          followUps: [{ missionId: 'water-recycler-repair', afterDays: 3 }],
        },
        narrative:
          '{crew} made a quick fix in 3 hours. The toilet works, but the water recycler is still broken. You will lose a little water every day until it gets a full repair. That water would have become oxygen too!',
      },
    ],
  },

  // ─── Missão 4: O Vazamento Invisível (ISS, 2004) — Day 10 ───
  {
    id: 'invisible-leak',
    sourceNumber: 4,
    title: 'The Invisible Leak',
    description:
      "Warning: the air pressure is dropping very slowly. There is a small leak somewhere on the station, but nobody knows where. It's so small you can't hear it or see it. Time before it becomes a problem: 2 days.",
    act: 1,
    day: 5,
    system: 'oxygen',
    room: 'engineering',
    icon: '💨',
    severity: 'normal',
    nasaSource: 'ISS air leak',
    nasaYear: 2004,
    factKind: 'history',
    popup:
      'THIS REALLY HAPPENED! In 2004, a slow air leak was found on the ISS. After days of searching, the crew found it: a hose that astronauts had been using as a handhold had cracked a seal. Something that simple almost caused a serious emergency.',
    defer: {
      effects: [{ resource: 'oxygen', delta: -5 }],
      text: 'The leak keeps going: some air is lost before tomorrow.',
    },
    choices: [
      {
        id: 'lockdown-search',
        label: 'Lock down and search',
        icon: '🔒',
        crew: { min: 2, max: 4 },
        time: '1 full day',
        effects: [
          { resource: 'oxygen', delta: -2 },
          { resource: 'satisfaction', delta: -4 },
        ],
        narrative:
          '{crew} closed the doors between all modules and checked the pressure in each one. Found it! A hose that someone grabbed as a handhold had cracked a seal. Easy fix once found, but the crew spent the day in small, closed spaces.',
      },
      {
        id: 'listen-for-it',
        label: 'Listen for the hiss',
        icon: '👂',
        crew: { min: 1, max: 2 },
        time: '4 hours',
        successRate: 85,
        effects: [{ resource: 'oxygen', delta: -1 }],
        narrative: '{crew} went through the station with ultrasonic leak detectors. Found the hiss in 4 hours and fixed it fast!',
        failEffects: [{ resource: 'oxygen', delta: -4 }],
        onFail: {
          addConditions: [
            { id: 'air-leak', label: 'Air leak not found: air is escaping', daily: [{ resource: 'oxygen', delta: -2 }] },
          ],
          followUps: [{ missionId: 'leak-lockdown', afterDays: 1 }],
        },
        failNarrative:
          "{crew} couldn't find the leak today and the pressure dropped more. Tomorrow you must do the full lockdown, with less air.",
      },
      {
        id: 'eva-inspect',
        spacewalk: true,
        label: 'Check from outside',
        icon: '🧑‍🚀',
        crew: { min: 1, best: ['engineer'] },
        time: '5 hours of preparation + spacewalk',
        fatigue: 2,
        effects: [
          { resource: 'oxygen', delta: -4 },
          { resource: 'radiation', delta: 2 },
        ],
        onSuccess: { setFlags: ['weak-spots-known'], crewRestDays: 1 },
        narrative:
          '{crew} breathed pure oxygen for hours (to avoid decompression sickness), then went outside. Found the leak AND two weak spots on the hull, fixed before they become leaks. But {crew} is exhausted and must rest tomorrow.',
      },
    ],
  },

  // ─── Missão 6: O Problema Lento (ISS, 2007-2017) — Day 20 ───
  {
    id: 'slow-problem',
    sourceNumber: 6,
    title: 'The Slow Problem',
    description:
      "Notice: the cooling system has a small leak. Tiny drops of coolant are floating away into space. It's not dangerous yet, but it will get worse over time. Cooling system: 95% working.",
    act: 1,
    day: 10,
    system: 'energy',
    room: 'airlock',
    icon: '🌡️',
    severity: 'normal',
    nasaSource: 'ISS ammonia cooling leak',
    nasaYear: 2007,
    factKind: 'history',
    popup:
      'THIS REALLY HAPPENED! The ISS had a slow ammonia leak in its cooling system that took 10 YEARS to fully fix (2007 to 2017). Astronauts did many spacewalks over the years to find and repair it. Sometimes the best answer to a slow problem is a slow fix.',
    defer: {
      effects: [{ resource: 'energy', delta: -1 }],
      text: 'A slow leak can wait a day. It loses a little cooling.',
    },
    choices: [
      {
        id: 'fix-now-eva',
        spacewalk: true,
        label: 'Fix it now with a spacewalk',
        icon: '🧑‍🚀',
        crew: { min: 1, best: ['engineer'] },
        time: '6 hours outside',
        fatigue: 2,
        effects: [
          { resource: 'oxygen', delta: -3 },
          { resource: 'radiation', delta: 3 },
        ],
        onSuccess: { setFlags: ['coolant-fixed'] },
        narrative:
          '{crew} went outside, found the leak and patched it. Cooling is back to 100%! The spacewalk used oxygen from the suit and gave a higher radiation dose, and {crew} is tired.',
      },
      {
        id: 'monitor-wait',
        label: 'Monitor and wait',
        icon: '📊',
        crew: { min: 1 },
        time: '1 hour of checks',
        fatigue: 0,
        temporary: true,
        effects: [],
        onSuccess: {
          addConditions: [
            {
              id: 'coolant-leak',
              label: 'Cooling leak growing: machines run a bit hotter',
              daily: [{ resource: 'energy', delta: -0.3 }],
            },
          ],
          followUps: [{ missionId: 'coolant-leak-urgent', afterDays: 10, unlessFlag: 'coolant-fixed' }],
        },
        narrative:
          '{crew} set up checks to watch the leak. No resources spent today. But the leak keeps growing: in about 10 days it will become urgent and harder to fix.',
      },
      {
        id: 'reroute-coolant',
        label: 'Reroute the coolant',
        icon: '🔀',
        crew: { min: 1, best: ['engineer'] },
        time: '4 hours inside',
        temporary: true,
        effects: [{ resource: 'energy', delta: -2 }],
        onSuccess: {
          addConditions: [
            {
              id: 'coolant-backup',
              label: 'Coolant on backup pipes (90% cooling)',
              daily: [{ resource: 'energy', delta: -0.2 }],
            },
          ],
          followUps: [
            { missionId: 'coolant-leak-urgent', afterDays: 6, afterDaysMax: 9, chance: 40, unlessFlag: 'coolant-fixed' },
          ],
        },
        narrative:
          '{crew} sent the coolant through smaller backup pipes, around the leaky part. No spacewalk needed! Cooling works at 90%. But the leak is still there: if the backup pipes have a problem too, you are in trouble.',
      },
    ],
  },

  // ─── Missão 5: Ar Tóxico (ISS, 2006) — Day 35 ───
  {
    id: 'toxic-air',
    sourceNumber: 5,
    title: 'Toxic Air!',
    description:
      'DANGER! The oxygen machine overheated and is smoking! The air smells like burning rubber. Oxygen machine: OFF. Air quality: toxic smoke. Oxygen reserve: 2 days.',
    act: 2,
    day: 18,
    system: 'oxygen',
    room: 'engineering',
    icon: '☁️',
    severity: 'critical',
    nasaSource: 'ISS Elektron oxygen generator',
    nasaYear: 2006,
    factKind: 'history',
    popup:
      "THIS REALLY HAPPENED! In 2006, the oxygen generator on the ISS overheated and released toxic smoke. The 3 astronauts put on masks and gloves. It was one of the station's first real emergencies.",
    defer: {
      effects: [
        { resource: 'oxygen', delta: -10 },
        { resource: 'health', delta: -6 },
      ],
      text: 'Waiting means a day of smoke and no new oxygen. It hurts.',
    },
    choices: [
      {
        id: 'masks-restart',
        label: 'Masks on, restart the machine',
        icon: '😷',
        crew: { min: 1, max: 2, best: ['engineer'] },
        time: '1 hour',
        successRate: 60,
        retryOnFail: true,
        effects: [{ resource: 'oxygen', delta: -3 }],
        onSuccess: {
          addConditions: [
            { id: 'o2-weak', label: 'Oxygen machine at 70%', daily: [{ resource: 'oxygen', delta: -1 }] },
          ],
          followUps: [{ missionId: 'o2-machine-repair', afterDays: 1 }],
        },
        narrative:
          'Everyone put on masks while {crew} restarted the machine. It works again, but only at 70% power. It needs a full repair tomorrow.',
        failEffects: [
          { resource: 'oxygen', delta: -6 },
          { resource: 'health', delta: -3 },
        ],
        failNarrative:
          "The machine won't start, and time was lost in the smoke. Now you must pick another option fast!",
      },
      {
        id: 'candles',
        label: 'Shut it down, light oxygen candles',
        icon: '🕯️',
        crew: { min: 1 },
        time: '30 minutes',
        needsCandles: 8,
        effects: [{ resource: 'oxygen', delta: 2 }],
        onSuccess: {
          candles: -8,
          followUps: [{ missionId: 'o2-machine-repair', afterDays: 1 }],
        },
        narrative:
          '{crew} turned off the broken machine and lit emergency oxygen candles. Each candle gives one person oxygen for one day. The smoke clears in a few hours, but the clock is ticking: fix the machine before the candles run out.',
      },
      {
        id: 'ventilate-wait',
        label: 'Ventilate and wait',
        icon: '🌀',
        crew: { min: 1, best: ['engineer'] },
        time: '8 hours',
        effects: [{ resource: 'oxygen', delta: -12 }],
        narrative:
          'The fans pushed the smoke into the filters. 8 hours later the air was clean and {crew} could see the problem clearly: a burned wire. Easy fix! But you spent a whole day without making oxygen.',
      },
    ],
  },

  // ─── Missão 8: Água Suja (ISS, 2009) — Day 40 ───
  {
    id: 'dirty-water',
    sourceNumber: 8,
    title: 'Dirty Water',
    description:
      "Alert! The water recycler is making dirty water. The machine that cleans pee, sweat and breath moisture into drinking water isn't working right. Clean water reserve: 5 days. The oxygen machine needs CLEAN water only.",
    act: 2,
    day: 20,
    system: 'water',
    room: 'engineering',
    icon: '🚱',
    severity: 'normal',
    nasaSource: 'ISS Water Recovery System',
    nasaYear: 2009,
    factKind: 'history',
    popup:
      "THIS REALLY HAPPENED! In 2009, the ISS water recycler broke while the station was crowded (a Space Shuttle was visiting). On a Mars mission this would be even scarier: there's no cargo ship bringing spare parts.",
    defer: {
      effects: [
        { resource: 'water', delta: -5 },
        { resource: 'health', delta: -2 },
      ],
      text: 'One more day on the clean reserve, with no repair started.',
    },
    choices: [
      {
        id: 'use-reserve',
        label: 'Use clean reserves while we fix it',
        icon: '🫙',
        crew: { min: 1, max: 2, best: ['engineer'] },
        time: '3 days',
        busyDays: 2,
        fatigue: 2,
        effects: [{ resource: 'water', delta: -2 }],
        onSuccess: {
          addConditions: [
            { id: 'dirty-water', label: 'Using the clean water reserve', daily: [{ resource: 'water', delta: -2 }] },
          ],
        },
        onDone: { clearConditions: ['dirty-water'] },
        onInterrupt: {
          effects: [{ resource: 'water', delta: -6 }],
          text: 'The recycler repair stopped halfway.',
          resumeMissionId: 'recycler-repair-finish',
        },
        narrative:
          'Everyone drinks only clean emergency water and the oxygen machine stays safe. {crew} will work on the recycler for 3 days. The reserve drops every day, so the clock is ticking.',
      },
      {
        id: 'double-filter',
        label: 'Double-filter the dirty water',
        icon: '🔁',
        crew: { min: 1 },
        time: '4 hours',
        successRate: 80,
        effects: [{ resource: 'energy', delta: -5 }],
        narrative:
          '{crew} ran the water through the recycler twice. It used extra energy, but the water is clean enough. The oxygen machine works!',
        failEffects: [
          { resource: 'energy', delta: -5 },
          { resource: 'oxygen', delta: -5 },
        ],
        onFail: { followUps: [{ missionId: 'o2-filter-clogged', afterDays: 0 }] },
        failNarrative:
          'The water was still dirty, and the oxygen machine filter got clogged. Now you have TWO things to fix: a new problem just appeared in the Life Support Node!',
      },
      {
        id: 'ration-and-fix',
        label: 'Fix it first, ration all water',
        icon: '🥤',
        crew: { min: 1, max: 2, best: ['engineer'] },
        time: '2 days',
        busyDays: 1,
        effects: [
          { resource: 'satisfaction', delta: -10 },
          { resource: 'health', delta: -2 },
        ],
        onSuccess: {
          addConditions: [
            {
              id: 'rationing',
              label: 'Water rationing: half water for everyone',
              daily: [
                { resource: 'satisfaction', delta: -2 },
                { resource: 'health', delta: -1 },
              ],
              days: 2,
            },
          ],
        },
        onInterrupt: {
          effects: [{ resource: 'water', delta: -4 }],
          text: 'The recycler repair stopped halfway.',
          resumeMissionId: 'recycler-repair-finish',
        },
        narrative:
          'Everyone gets half their normal water and no showers. The crew is thirsty and grumpy, but {crew} can focus fully on the recycler for 2 days.',
      },
    ],
  },

  // ─── Missão 3: Colisão! (MIR, junho 1997) — Day 48 ───
  {
    id: 'supply-ship-crash',
    sourceNumber: 3,
    title: 'Crash!',
    description:
      'IMPACT! A supply ship hit the station while docking at the Cargo Bay! There is a hole and air is leaking out slowly. The solar panels on that side were destroyed. Time before the pressure is dangerous: 2 hours.',
    act: 2,
    day: 26,
    system: 'energy',
    room: 'storage',
    icon: '💥',
    severity: 'critical',
    nasaSource: 'Mir space station, Spektr module',
    nasaYear: 1997,
    factKind: 'history',
    popup:
      'THIS REALLY HAPPENED! In June 1997, a supply ship crashed into the Spektr module of the Mir space station. The crew rushed to cut the cables and close the hatch to stop the air leak. They lost the solar panels on that module and a lot of power. It was the worst collision in space station history.',
    defer: false,
    choices: [
      {
        id: 'seal-now',
        label: 'Seal the module NOW',
        icon: '🚪',
        crew: { min: 1 },
        time: '10 minutes',
        effects: [{ resource: 'energy', delta: -15 }],
        onSuccess: {
          addConditions: [
            {
              id: 'lost-panels',
              label: 'Lost solar panels: less power for the rest of the mission',
              daily: [{ resource: 'energy', delta: -0.3 }],
            },
          ],
        },
        narrative:
          '{crew} closed the door to the damaged module. The leak stopped and the station is safe. But the solar panels and everything in that module are lost: from now on you have less power every day.',
      },
      {
        id: 'quick-rescue',
        label: 'Quick rescue, then seal',
        icon: '🏃',
        crew: { min: 1, best: ['engineer'] },
        time: '30 minutes in a leaking module',
        successRate: 70,
        effects: [{ resource: 'energy', delta: -15 }],
        onSuccess: {
          setFlags: ['spare-parts'],
          addConditions: [
            {
              id: 'lost-panels',
              label: 'Lost solar panels: less power for the rest of the mission',
              daily: [{ resource: 'energy', delta: -0.3 }],
            },
          ],
        },
        narrative:
          '{crew} grabbed spare parts and tools from the leaking module, then sealed it. Power still dropped, but you now have spare parts: future repairs will be easier!',
        failEffects: [
          { resource: 'energy', delta: -15 },
          { resource: 'oxygen', delta: -8 },
          { resource: 'health', delta: -6 },
        ],
        onFail: {
          crewHealth: -25,
          crewRestDays: 1,
          addConditions: [
            {
              id: 'lost-panels',
              label: 'Lost solar panels: less power for the rest of the mission',
              daily: [{ resource: 'energy', delta: -0.3 }],
            },
          ],
        },
        failNarrative:
          '{crew} got dizzy in the thin air and had to be pulled out. The door closed late and more air was lost. {crew} must rest tomorrow.',
      },
    ],
  },

  // ─── Missão 9: Quase Afogado no Espaço (ISS EVA-23, 2013) — Day 55 ───
  {
    id: 'water-in-helmet',
    sourceNumber: 9,
    title: 'Water in the Helmet!',
    description:
      'EMERGENCY! {outside} is outside the station doing a repair and just reported water inside the helmet! The suit cooling system is leaking and the water is floating toward the eyes and nose. Repair: 60% done. Time to get back inside: 15 minutes.',
    act: 2,
    day: 28,
    system: 'oxygen',
    room: 'airlock',
    icon: '⛑️',
    severity: 'critical',
    nasaSource: 'ISS spacewalk EVA-23',
    nasaYear: 2013,
    factKind: 'history',
    popup:
      "THIS REALLY HAPPENED! In July 2013, astronaut Luca Parmitano's helmet filled with water during a spacewalk. He couldn't see, hear, or speak well. He found his way back to the airlock by feel. A week earlier, a little water had been blamed on a leaky drink bag. The real cause was a clogged filter in the suit's cooling system.",
    defer: false,
    crewOutside: true,
    choices: [
      {
        id: 'come-back-now',
        label: 'Come back NOW!',
        icon: '↩️',
        crew: { min: 0 },
        time: '15 minutes',
        effects: [{ resource: 'oxygen', delta: -2 }],
        onSuccess: {
          addConditions: [
            {
              id: 'outside-broken',
              label: 'Outside equipment still broken',
              daily: [{ resource: 'energy', delta: -0.5 }],
            },
          ],
          followUps: [{ missionId: 'finish-outside-repair', afterDays: 2, afterDaysMax: 3 }],
        },
        narrative:
          '{crew} came back safely and the helmet was dried. But the repair outside is only 60% done, so the broken equipment stays broken. Another spacewalk will be needed in a few days.',
      },
      {
        id: 'finish-fast',
        label: 'Finish fast, then come back',
        icon: '⏱️',
        crew: { min: 0 },
        time: '5 more minutes outside',
        successRate: 50,
        effects: [{ resource: 'health', delta: -4 }],
        onSuccess: { crewHealth: -20, crewRestDays: 3 },
        narrative:
          'Repair done! But {crew} came back barely able to see, with water near the nose. {crew} is shaken up and will not be sent anywhere for a few days.',
        failEffects: [
          { resource: 'health', delta: -8 },
          { resource: 'satisfaction', delta: -5 },
        ],
        onFail: {
          crewHealth: -30,
          crewRestDays: 3,
          addConditions: [
            {
              id: 'outside-broken',
              label: 'Outside equipment still broken',
              daily: [{ resource: 'energy', delta: -0.5 }],
            },
          ],
          followUps: [{ missionId: 'finish-outside-repair', afterDays: 2, afterDaysMax: 3 }],
        },
        failNarrative:
          'The water covered the eyes completely. {crew} could not see the way to the airlock, and another crew member had to rush out to help. Everyone is safe, but exhausted, and the repair is STILL not done.',
      },
      {
        id: 'buddy-rescue',
        spacewalk: true,
        label: 'Send a buddy to help',
        icon: '🤝',
        crew: { min: 1, max: 1 },
        time: '30 minutes',
        effects: [
          { resource: 'oxygen', delta: -4 },
          { resource: 'radiation', delta: 2 },
        ],
        onSuccess: {
          crewFatigue: 1,
          addConditions: [
            {
              id: 'outside-broken',
              label: 'Outside equipment still broken',
              daily: [{ resource: 'energy', delta: -0.5 }],
            },
          ],
          followUps: [{ missionId: 'finish-outside-repair', afterDays: 2, afterDaysMax: 3 }],
        },
        narrative:
          'A second astronaut went out and guided the way back while the head stayed tilted to keep water away from the nose. {crew} are safe, but tired, and two suits need recharging. The repair is not finished.',
      },
    ],
  },

  // ─── Missão 1: O Filtro Quebrado (Apollo 13, 1970) — Day 68 ───
  {
    id: 'co2-filter-broke',
    sourceNumber: 1,
    title: 'The Broken Filter',
    description:
      "ALERT! The CO2 filter just broke. CO2 is a gas that builds up when you breathe. Too much CO2 makes you dizzy and sleepy. You have spare filters, but they are the wrong shape: they don't fit the machine. Time before danger: 6 hours.",
    act: 3,
    day: 34,
    system: 'oxygen',
    room: 'engineering',
    icon: '🫧',
    severity: 'critical',
    nasaSource: 'Apollo 13',
    nasaYear: 1970,
    factKind: 'history',
    popup:
      "YOU JUST LIVED THROUGH APOLLO 13! In 1970, an oxygen tank exploded about 320,000 km from Earth. The crew used the small lunar module as a lifeboat. Its CO2 filters didn't fit, so engineers on Earth invented an adapter with duct tape, plastic bags and cardboard. The astronauts built it in space and it saved their lives.",
    defer: {
      effects: [
        { resource: 'oxygen', delta: -8 },
        { resource: 'health', delta: -6 },
      ],
      text: 'CO2 keeps rising overnight: everyone feels dizzy.',
    },
    choices: [
      {
        id: 'build-adapter',
        label: 'Build an adapter',
        icon: '🩹',
        crew: { min: 1, max: 2, best: ['engineer'] },
        time: '3 hours',
        successRate: 80,
        retryOnFail: true,
        fatigue: 2,
        effects: [{ resource: 'oxygen', delta: -2 }],
        narrative:
          '{crew} built an adapter with tape, plastic bags and cardboard. It fits! CO2 drops back to safe, and this fix lasts. {crew} is tired and will work slower tomorrow.',
        failEffects: [
          { resource: 'oxygen', delta: -5 },
          { resource: 'health', delta: -4 },
        ],
        failNarrative: "The adapter didn't hold and CO2 reached the warning level. Pick another option fast!",
      },
      {
        id: 'everybody-rest',
        label: 'Everybody rests',
        icon: '🛌',
        crew: { min: 4, everyone: true },
        time: '6 hours',
        fatigue: 0,
        effects: [
          { resource: 'oxygen', delta: -3 },
          { resource: 'satisfaction', delta: -3 },
        ],
        onSuccess: {
          addConditions: [
            { id: 'co2-high', label: 'CO2 filter still broken: the air is stuffy', daily: [{ resource: 'health', delta: -1 }] },
          ],
          followUps: [{ missionId: 'co2-filter-fix', afterDays: 1 }],
        },
        narrative:
          'The whole crew lay down and stayed very still. Moving less = breathing less = less CO2. It bought time, but NO work got done today, and the filter still needs fixing tomorrow.',
      },
      {
        id: 'oxygen-candle',
        label: 'Use an emergency oxygen candle',
        icon: '🕯️',
        crew: { min: 1 },
        time: '4 hours gained',
        needsCandles: 1,
        temporary: true,
        effects: [{ resource: 'oxygen', delta: 4 }],
        onSuccess: {
          candles: -1,
          addConditions: [
            { id: 'co2-high', label: 'CO2 filter still broken: the air is stuffy', daily: [{ resource: 'health', delta: -1 }] },
          ],
          followUps: [
            { missionId: 'co2-filter-fix', afterDays: 1 },
            { missionId: 'fire-on-station', afterDays: 1, afterDaysMax: 2, chance: 10 },
          ],
        },
        narrative:
          '{crew} burned an oxygen candle. It adds fresh oxygen but does NOT remove CO2, it only dilutes it. You gained 4 hours, but the candle is gone forever, and burning candles always has a small fire risk.',
      },
    ],
  },

  // ─── Missão 2: Fogo na Estação (MIR, fevereiro 1997) — Day 72 (or earlier, after a candle) ───
  {
    id: 'fire-on-station',
    sourceNumber: 2,
    title: 'Fire on the Station!',
    description:
      'EMERGENCY! An oxygen candle caught fire! These candles normally make oxygen, but this one is burning out of control. Smoke is filling the room, and the fire blocks the way to one of the escape capsules.',
    act: 3,
    day: 36,
    system: 'oxygen',
    room: 'engineering',
    icon: '🔥',
    severity: 'critical',
    nasaSource: 'Mir space station',
    nasaYear: 1997,
    factKind: 'history',
    popup:
      'THIS REALLY HAPPENED! In February 1997, an oxygen candle caught fire on the Mir space station. The flames burned for about 14 minutes and blocked the way to one of the two escape capsules. The crew fought the fire with extinguishers. Nobody died, but the smoke made the air bad for days.',
    defer: false,
    choices: [
      {
        id: 'fight-fire',
        label: 'Fight the fire',
        icon: '🧯',
        crew: { min: 2, max: 2, allowFewer: true },
        time: '15 minutes',
        successRate: 85,
        effects: [{ resource: 'health', delta: -6 }],
        onSuccess: {
          crewHealth: -15,
          addConditions: [
            {
              id: 'smoke',
              label: 'Smoke in the air: headaches, everyone works slower',
              daily: [{ resource: 'health', delta: -1 }],
              days: 3,
              successPenalty: 10,
            },
          ],
        },
        narrative:
          '{crew} put out the flames with extinguishers! You keep every room and both escape capsules. But they breathed toxic smoke, and the smoke stays in the air for 3 days: headaches and slower work for everyone.',
        failEffects: [
          { resource: 'energy', delta: -10 },
          { resource: 'oxygen', delta: -8 },
          { resource: 'health', delta: -8 },
        ],
        onFail: { crewHealth: -15 },
        failNarrative:
          'The fire was too big for {crew}. They had to back away while it burned itself out, and equipment was damaged.',
      },
      {
        id: 'seal-room',
        label: 'Seal the room',
        icon: '🚪',
        crew: { min: 1 },
        time: '5 minutes',
        effects: [
          { resource: 'energy', delta: -8 },
          { resource: 'oxygen', delta: -5 },
        ],
        onSuccess: { clearFlags: ['spare-parts'], setFlags: ['room-sealed-after-fire'] },
        narrative:
          '{crew} closed the door: no air means the fire dies. Nobody breathed smoke. But everything in that room is lost, including tools and spare parts, and the way to one escape capsule.',
      },
      {
        id: 'evacuate',
        label: 'Evacuate to the safe side',
        icon: '🏃',
        crew: { min: 4, everyone: true },
        time: '1 hour',
        successRate: 50,
        fatigue: 0,
        effects: [{ resource: 'energy', delta: -5 }],
        narrative: 'Everyone waited by the safe escape capsule until the fire ran out of air. Lucky: the damage was small.',
        failEffects: [
          { resource: 'energy', delta: -15 },
          { resource: 'oxygen', delta: -10 },
        ],
        failNarrative:
          'Everyone is safe, but the fire spread before it ran out of air. It damaged important equipment.',
      },
    ],
  },

  // ─── Missão 10: Dedo no Buraco (Soyuz MS-09, 2018) — Day 75 ───
  {
    id: 'micrometeorite-hole',
    sourceNumber: 10,
    title: 'Finger in the Hole',
    description:
      'ALERT! A tiny hole (2 millimeters, the size of a pencil tip) was found in the station wall. Air is slowly hissing out into space and the pressure is slowly going down.',
    act: 3,
    day: 38,
    system: 'oxygen',
    room: 'airlock',
    icon: '🕳️',
    severity: 'normal',
    nasaSource: 'ISS, Soyuz MS-09',
    nasaYear: 2018,
    factKind: 'history',
    popup:
      'THIS REALLY HAPPENED! In August 2018, a 2 mm hole was found in a Soyuz capsule docked to the ISS. Astronaut Alexander Gerst put his FINGER over the hole to slow the leak while cosmonaut Sergey Prokopyev prepared epoxy glue and gauze to seal it. The patch worked!',
    defer: {
      effects: [{ resource: 'oxygen', delta: -6 }],
      text: 'The hole keeps hissing until tomorrow.',
    },
    choices: [
      {
        id: 'epoxy-patch',
        label: 'Quick patch with epoxy',
        icon: '🩹',
        crew: { min: 1, best: ['engineer'] },
        time: '30 minutes',
        temporary: true,
        effects: [{ resource: 'oxygen', delta: -1 }],
        onSuccess: {
          followUps: [
            { missionId: 'patch-failing', afterDays: 4, afterDaysMax: 7, chance: 35, unlessFlag: 'hull-fixed' },
          ],
        },
        narrative:
          '{crew} put medical gauze soaked in epoxy glue over the hole. The leak stopped! But epoxy is a temporary patch: it may hold for months, or crack if the station shakes.',
      },
      {
        id: 'metal-plate',
        label: 'Permanent repair from inside',
        icon: '🔩',
        crew: { min: 1, max: 2, best: ['engineer'] },
        time: 'All day',
        fatigue: 2,
        effects: [{ resource: 'oxygen', delta: -4 }],
        onSuccess: { setFlags: ['hull-fixed'] },
        narrative:
          '{crew} cut out the damaged part and fixed a metal plate over it. Some air leaked while they worked, but this repair lasts forever.',
      },
      {
        id: 'seal-investigate',
        label: 'Seal the module and investigate',
        icon: '🔬',
        crew: { min: 1, max: 2, best: ['scientist'] },
        time: '2 days',
        busyDays: 1,
        effects: [
          { resource: 'energy', delta: -3 },
          { resource: 'satisfaction', delta: -3 },
        ],
        onSuccess: { setFlags: ['hull-fixed', 'weak-spots-known'] },
        onInterrupt: { effects: [{ resource: 'satisfaction', delta: -2 }], text: 'The investigation stopped early.' },
        narrative:
          '{crew} closed the module and studied the hole for 2 days. Cause: a tiny space rock. They also found two thin spots on the hull and fixed everything properly. No air was lost from the main station.',
      },
    ],
  },

  // ════════════════ Follow-ups (set off only by the choices above) ════════════════

  {
    id: 'toilet-fix',
    followUpOnly: true,
    title: 'Fix the Toilet',
    description: 'The crew used emergency bags all night. Today the toilet must be fixed!',
    act: 1,
    system: 'water',
    room: 'bathroom',
    icon: '🚽',
    severity: 'normal',
    nasaSource: 'ISS toilet',
    factKind: 'tip',
    popup:
      "SPACE TIP: A space toilet uses moving air instead of water to pull waste away, because there's no gravity to make things fall.",
    defer: {
      effects: [
        { resource: 'satisfaction', delta: -5 },
        { resource: 'water', delta: -1 },
      ],
      text: 'Another day of emergency bags.',
    },
    choices: [
      {
        id: 'engineer-fix',
        label: 'Proper repair',
        icon: '🔧',
        crew: { min: 1, best: ['engineer'] },
        time: '3 hours',
        effects: [{ resource: 'energy', delta: -2 }],
        narrative: '{crew} fixed the toilet. Everyone is relieved, in every sense!',
      },
      {
        id: 'anyone-try',
        label: 'Anyone free gives it a try',
        icon: '🪛',
        crew: { min: 1 },
        time: '2 hours',
        successRate: 70,
        effects: [],
        narrative: '{crew} followed the manual step by step, and it worked!',
        failEffects: [{ resource: 'satisfaction', delta: -5 }],
        failNarrative: "{crew} tried, but it's still broken and the crew is grumpy. Time for a proper repair!",
        retryOnFail: true,
      },
    ],
  },

  {
    id: 'water-recycler-repair',
    followUpOnly: true,
    title: 'Repair the Water Recycler',
    description:
      'The quick fix is holding the toilet together, but the water recycler is still off. You keep losing water every day.',
    act: 1,
    system: 'water',
    room: 'bathroom',
    icon: '♻️',
    severity: 'normal',
    nasaSource: 'ISS Water Recovery System',
    factKind: 'tip',
    popup:
      'SPACE TIP: The ISS recycles about 98% of its water, including pee and sweat. It is filtered and cleaned so well that it is cleaner than most tap water on Earth.',
    defer: { effects: [{ resource: 'water', delta: -1 }], text: 'The recycler stays off one more day.' },
    choices: [
      {
        id: 'full-repair',
        label: 'Full repair today',
        icon: '🔧',
        crew: { min: 1, max: 2, best: ['engineer'] },
        time: 'All day',
        fatigue: 2,
        effects: [{ resource: 'energy', delta: -5 }],
        onSuccess: { clearConditions: ['recycler-off'] },
        narrative: '{crew} took the recycler apart and fixed it. Water is being recycled again!',
      },
      {
        id: 'live-with-it',
        label: 'Live with it for now',
        icon: '🤷',
        crew: { min: 1 },
        time: '30 minutes of checks',
        fatigue: 0,
        effects: [],
        narrative:
          '{crew} checked that nothing else is leaking. The recycler stays off, so you keep losing water every day.',
      },
    ],
  },

  {
    id: 'leak-lockdown',
    followUpOnly: true,
    title: 'Lockdown: Find the Leak',
    description: "Yesterday's search failed and the air is still escaping. Close every module and test them one by one.",
    act: 1,
    system: 'oxygen',
    room: 'engineering',
    icon: '🔒',
    severity: 'critical',
    nasaSource: 'ISS air leak',
    factKind: 'tip',
    popup:
      'SPACE TIP: To find a leak, astronauts close the hatches between modules and watch which one loses pressure. Then they look closer with ultrasonic detectors.',
    defer: { effects: [{ resource: 'oxygen', delta: -4 }], text: 'Another day of escaping air.' },
    choices: [
      {
        id: 'full-lockdown',
        label: 'Full lockdown',
        icon: '🔒',
        crew: { min: 2, max: 4 },
        time: '1 full day',
        effects: [
          { resource: 'oxygen', delta: -2 },
          { resource: 'satisfaction', delta: -4 },
        ],
        onSuccess: { clearConditions: ['air-leak'] },
        narrative: '{crew} tested every module and found the cracked hose seal. Leak fixed!',
      },
    ],
  },

  {
    id: 'coolant-leak-urgent',
    followUpOnly: true,
    title: 'The Leak Got Worse',
    description:
      'The cooling leak you were watching is now serious. Machines are getting hot and some must be turned off. It needs a spacewalk.',
    act: 2,
    system: 'energy',
    room: 'airlock',
    icon: '🌡️',
    severity: 'critical',
    nasaSource: 'ISS ammonia cooling leak',
    factKind: 'tip',
    popup:
      'SPACE TIP: The ISS cooling system pumps ammonia through big radiators outside. Ammonia carries heat away from the machines, and the radiators send it out into space.',
    defer: {
      effects: [
        { resource: 'energy', delta: -6 },
        { resource: 'satisfaction', delta: -3 },
      ],
      text: 'Machines overheat one more day.',
    },
    choices: [
      {
        id: 'two-person-eva',
        spacewalk: true,
        label: 'Two-person spacewalk',
        icon: '🧑‍🚀',
        crew: { min: 2, max: 2, best: ['engineer'], allowFewer: true },
        time: '7 hours outside',
        successRate: 90,
        fatigue: 2,
        effects: [
          { resource: 'oxygen', delta: -4 },
          { resource: 'radiation', delta: 4 },
        ],
        onSuccess: { setFlags: ['coolant-fixed'], clearConditions: ['coolant-leak', 'coolant-backup'] },
        narrative: '{crew} went out together and replaced the leaky part. Cooling is back to 100% for good!',
        failEffects: [
          { resource: 'energy', delta: -8 },
          { resource: 'radiation', delta: 4 },
        ],
        failNarrative: "{crew} couldn't finish before the suits ran low. The leak is still there.",
      },
      {
        id: 'shut-down-machines',
        label: 'Turn off machines to stay cool',
        icon: '🔌',
        crew: { min: 1 },
        time: '1 hour',
        fatigue: 0,
        effects: [
          { resource: 'energy', delta: -10 },
          { resource: 'satisfaction', delta: -5 },
        ],
        narrative:
          '{crew} turned off everything that is not needed. The station cooled down, but the leak is still there, slowly costing power.',
      },
    ],
  },

  {
    id: 'o2-machine-repair',
    followUpOnly: true,
    title: 'Repair the Oxygen Machine',
    description: 'The oxygen machine is not fixed for real yet. It needs a full repair before it fails again.',
    act: 2,
    system: 'oxygen',
    room: 'engineering',
    icon: '🫁',
    severity: 'normal',
    nasaSource: 'ISS Elektron oxygen generator',
    factKind: 'tip',
    popup:
      'SPACE TIP: The oxygen machine splits water (H2O) into hydrogen and oxygen using electricity. That is why it needs both clean water and energy.',
    defer: { effects: [{ resource: 'oxygen', delta: -4 }], text: 'One more day with a weak oxygen machine.' },
    choices: [
      {
        id: 'full-repair',
        label: 'Full repair',
        icon: '🔧',
        crew: { min: 1, max: 2, best: ['engineer'] },
        time: 'All day',
        fatigue: 2,
        effects: [{ resource: 'energy', delta: -4 }],
        onSuccess: { clearConditions: ['o2-weak'] },
        narrative: '{crew} replaced the burned parts. The oxygen machine runs at 100% again!',
      },
      {
        id: 'keep-running',
        label: 'Keep it running at 70%',
        icon: '⏳',
        crew: { min: 1 },
        time: '1 hour of checks',
        fatigue: 0,
        temporary: true,
        effects: [],
        onSuccess: {
          addConditions: [
            { id: 'o2-weak', label: 'Oxygen machine at 70%', daily: [{ resource: 'oxygen', delta: -1 }], days: 5 },
          ],
        },
        narrative:
          '{crew} checked the machine and left it at 70%. It makes less oxygen than you breathe, so the reserve drops a little every day.',
      },
    ],
  },

  {
    id: 'o2-filter-clogged',
    followUpOnly: true,
    title: 'Clogged Oxygen Filter',
    description: 'The dirty water clogged the filter of the oxygen machine. It is making less oxygen right now!',
    act: 2,
    system: 'oxygen',
    room: 'engineering',
    icon: '🫁',
    severity: 'critical',
    nasaSource: 'ISS Oxygen Generation System',
    factKind: 'tip',
    popup:
      "SPACE TIP: Dirty water can ruin the oxygen machine. That is why the station's water is tested before it goes in.",
    defer: { effects: [{ resource: 'oxygen', delta: -8 }], text: 'A clogged filter makes much less oxygen.' },
    choices: [
      {
        id: 'clean-filter',
        label: 'Clean the filter',
        icon: '🧽',
        crew: { min: 1 },
        time: '3 hours',
        successRate: 75,
        effects: [{ resource: 'energy', delta: -2 }],
        narrative: '{crew} took the filter out and cleaned it. The oxygen machine breathes again!',
        failEffects: [
          { resource: 'oxygen', delta: -5 },
          { resource: 'energy', delta: -2 },
        ],
        failNarrative: "The filter was too clogged to clean. {crew} put it back, but it's still slow. The air got thinner today.",
      },
      {
        id: 'replace-filter',
        label: 'Replace it with a new one',
        icon: '🔩',
        crew: { min: 1, best: ['engineer'] },
        time: '5 hours',
        fatigue: 2,
        effects: [{ resource: 'energy', delta: -4 }],
        narrative: '{crew} fitted a brand new filter. Problem solved for good.',
      },
    ],
  },

  {
    id: 'recycler-repair-finish',
    followUpOnly: true,
    title: 'Finish the Recycler Repair',
    description: 'The water recycler repair was stopped halfway. Someone must finish it.',
    act: 2,
    system: 'water',
    room: 'engineering',
    icon: '♻️',
    severity: 'normal',
    nasaSource: 'ISS Water Recovery System',
    factKind: 'tip',
    popup:
      'SPACE TIP: Half-finished repairs are risky in space. Astronauts follow checklists so the next person knows exactly where the work stopped.',
    defer: { effects: [{ resource: 'water', delta: -3 }], text: 'Still on the clean reserve.' },
    choices: [
      {
        id: 'finish',
        label: 'Finish the repair',
        icon: '🔧',
        crew: { min: 1, max: 2, best: ['engineer'] },
        time: 'All day',
        fatigue: 2,
        effects: [{ resource: 'energy', delta: -3 }],
        onSuccess: { clearConditions: ['dirty-water'] },
        narrative: '{crew} finished the job. The recycler makes clean water again!',
      },
    ],
  },

  {
    id: 'finish-outside-repair',
    followUpOnly: true,
    title: 'Finish the Outside Repair',
    description: 'The suits are dry and recharged. The repair outside the station is still only 60% done.',
    act: 2,
    system: 'energy',
    room: 'airlock',
    icon: '🧑‍🚀',
    severity: 'normal',
    nasaSource: 'ISS spacewalks',
    factKind: 'tip',
    popup:
      'SPACE TIP: After the 2013 helmet leak, NASA added a small snorkel and an absorbent pad inside spacesuit helmets, just in case.',
    defer: { effects: [{ resource: 'energy', delta: -1 }], text: 'The broken part waits outside.' },
    choices: [
      {
        id: 'spacewalk',
        spacewalk: true,
        label: SPACEWALK,
        icon: '🧑‍🚀',
        crew: { min: 1, max: 2, best: ['engineer'] },
        time: '6 hours outside',
        successRate: 85,
        fatigue: 2,
        effects: [
          { resource: 'oxygen', delta: -3 },
          { resource: 'radiation', delta: 2 },
        ],
        onSuccess: { clearConditions: ['outside-broken'] },
        narrative: '{crew} finished the repair outside. Everything works again!',
        failEffects: [
          { resource: 'oxygen', delta: -3 },
          { resource: 'radiation', delta: 2 },
        ],
        failNarrative: "{crew} couldn't finish: a bolt was stuck. The part stays broken for now.",
      },
      {
        id: 'leave-it',
        label: 'Leave it broken',
        icon: '🤷',
        crew: { min: 1 },
        time: '30 minutes',
        fatigue: 0,
        effects: [],
        narrative: '{crew} closed up the airlock. The broken part will keep costing a little power every day.',
      },
    ],
  },

  {
    id: 'patch-failing',
    followUpOnly: true,
    title: 'The Patch Is Hissing',
    description: 'The epoxy patch on the hole cracked. A thin hiss is back!',
    act: 3,
    system: 'oxygen',
    room: 'airlock',
    icon: '🕳️',
    severity: 'normal',
    nasaSource: 'ISS, Soyuz MS-09',
    factKind: 'tip',
    popup:
      'SPACE TIP: Quick patches buy time. Space crews always plan a permanent repair after an emergency fix.',
    defer: { effects: [{ resource: 'oxygen', delta: -5 }], text: 'Air hisses out until tomorrow.' },
    choices: [
      {
        id: 'new-epoxy',
        label: 'New epoxy patch',
        icon: '🩹',
        crew: { min: 1 },
        time: '30 minutes',
        temporary: true,
        effects: [{ resource: 'oxygen', delta: -1 }],
        narrative: '{crew} added a thicker layer of epoxy. The hiss stopped again.',
      },
      {
        id: 'metal-plate',
        label: 'Metal plate, for good',
        icon: '🔩',
        crew: { min: 1, max: 2, best: ['engineer'] },
        time: 'All day',
        fatigue: 2,
        effects: [{ resource: 'oxygen', delta: -3 }],
        onSuccess: { setFlags: ['hull-fixed'] },
        narrative: '{crew} fixed a metal plate over the hole. This one will not crack.',
      },
    ],
  },

  {
    id: 'co2-filter-fix',
    followUpOnly: true,
    title: 'Fix the CO2 Filter',
    description: 'You bought time, but the CO2 filter is still broken and the air is stuffy. Build the adapter today.',
    act: 3,
    system: 'oxygen',
    room: 'engineering',
    icon: '🫧',
    severity: 'critical',
    nasaSource: 'Apollo 13',
    factKind: 'tip',
    popup:
      'SPACE TIP: On Apollo 13 the instructions for the adapter were read to the crew by radio, step by step, because they could not send pictures.',
    defer: {
      effects: [
        { resource: 'oxygen', delta: -6 },
        { resource: 'health', delta: -5 },
      ],
      text: 'Another day of stuffy air.',
    },
    choices: [
      {
        id: 'adapter-solo',
        label: 'One person builds the adapter',
        icon: '🩹',
        crew: { min: 1, best: ['engineer'] },
        time: '3 hours',
        successRate: 80,
        fatigue: 2,
        effects: [],
        onSuccess: { clearConditions: ['co2-high'] },
        narrative: '{crew} built the adapter. The filter works and the air is fresh again!',
        failEffects: [{ resource: 'health', delta: -4 }],
        onFail: {
          addConditions: [
            {
              id: 'co2-high',
              label: 'CO2 filter still broken: the air is stuffy',
              daily: [{ resource: 'health', delta: -2 }],
              days: 2,
            },
          ],
        },
        failNarrative:
          'The adapter leaks a little. {crew} taped it as well as possible: the air stays stuffy for 2 more days, then the filter catches up.',
      },
      {
        id: 'adapter-team',
        label: 'Two people build it together',
        icon: '🤝',
        crew: { min: 2, max: 2, best: ['engineer'] },
        time: '2 hours',
        successRate: 95,
        effects: [],
        onSuccess: { clearConditions: ['co2-high'] },
        narrative: 'Two pairs of hands are better than one: {crew} built a perfect adapter. Fresh air!',
        failEffects: [{ resource: 'health', delta: -3 }],
        failNarrative: 'Even together, the first try leaked. {crew} fixed it by evening, but everyone has a headache.',
        onFail: { clearConditions: ['co2-high'] },
      },
    ],
  },
];
