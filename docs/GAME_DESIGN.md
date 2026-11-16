# Aurora Station -- Game Design Document

## Vision

Aurora Station is an educational space management game that teaches kids (ages 7-12) the real engineering trade-offs astronauts face on long-duration missions. Players learn about resource management, teamwork, and problem-solving through scenarios inspired by real NASA incidents. The game makes complex STEM concepts accessible through simple choices with visible consequences.

## Setting

- **Location**: Aurora Station, a research habitat in orbit around Mars
- **Timeline**: 45-day mission (Day 1 through Day 45; team decision 2026-11-15, was 90)
- **Constraint**: No resupply possible. Everything the crew needs is already on board. Every resource spent is gone forever.
- **Tone**: Hopeful and educational. Challenges are serious but never frightening. The crew supports each other.

## Player Character

- **Role**: Commander of Aurora Station
- **Name**: Chosen by the player at game start
- **Actions**: Walk around the station, talk to crew members, make mission decisions, delegate tasks
- **Perspective**: 2D top-down view. The player physically walks through the station to interact with crew and systems.

## Crew Members

Based on real NASA CHAPEA (Crew Health and Performance Exploration Analog) mission roles.

### 1. Commander (Player)
- The decision-maker. Responsible for all critical choices.
- Delegates tasks to crew but must walk to them to give orders.

### 2. Kira Santos -- Engineer
- **Role**: Maintains life support, power systems, and station structure
- **Accent Color**: Amber (#f5a623)
- **Personality**: Practical, hands-on, optimistic. Speaks in short direct sentences.
- **Strength**: Repairs, power management, EVA operations
- **Location**: Usually found in Engineering or Storage
- **Example dialogue**: "Power coupling is holding. For now."

### 3. Dr. Leo Park -- Medic
- **Role**: Crew health, medical emergencies, psychological well-being
- **Accent Color**: Green (#2ecc71)
- **Personality**: Calm, caring, detail-oriented. Always checking on the crew.
- **Strength**: Health management, morale, emergency medicine
- **Location**: Usually found in Medical Bay or Crew Quarters
- **Example dialogue**: "Everyone's vitals look good today."

### 4. Maya Torres -- Scientist
- **Role**: Research, data analysis, Mars observation, communications
- **Accent Color**: Purple (#8b5cf6)
- **Personality**: Curious, enthusiastic, sometimes distracted by discoveries. Loves sharing facts.
- **Strength**: Science missions, data collection, Earth communications
- **Location**: Usually found in the Lab or Common Room
- **Example dialogue**: "The dust storm data is incredible!"

## Station Rooms

The station is a connected set of rooms the player walks through. Each room has a purpose and interactive objects.

### Bridge
- **Purpose**: Command center. Mission briefings and critical decisions happen here.
- **Interactables**: Command console (start missions), comms panel (Earth messages), station status display
- **Crew**: Commander's station

### Crew Quarters
- **Purpose**: Rest and personal time. Affects morale.
- **Interactables**: Bunks (rest to restore morale), personal items, photo wall
- **Note**: Crew morale affects their effectiveness

### Lab
- **Purpose**: Scientific research and data collection
- **Interactables**: Research terminal (science missions), Mars observation window, sample storage
- **Crew**: Maya's primary station

### Medical Bay
- **Purpose**: Health monitoring and treatment
- **Interactables**: Medical scanner (crew health check), supply cabinet, treatment bed
- **Crew**: Leo's primary station

### Engineering
- **Purpose**: Life support and power systems
- **Interactables**: Power grid panel (energy management), O2 generator (oxygen system), shield controls
- **Crew**: Kira's primary station

### Storage
- **Purpose**: Supplies and spare parts
- **Interactables**: Supply crates (check inventory), spare parts rack, emergency kit
- **Note**: Limited supplies that deplete over the mission

### Common Room
- **Purpose**: Social area, meals, crew bonding
- **Interactables**: Meal station, exercise equipment, game table
- **Note**: Visiting here boosts crew morale

### Airlock
- **Purpose**: EVA (spacewalk) access
- **Interactables**: EVA suit station, exterior camera feed
- **Note**: EVAs are high-risk and consume resources but are sometimes necessary

## Resource System

Three interconnected resources, each on a 0-100 scale.

### Energy (Amber)
- **Source**: Solar panels
- **Drain**: All station systems consume energy. Life support, lights, heating, research equipment.
- **Critical at**: Below 20% -- systems start shutting down
- **Zero**: Station goes dark. Emergency power only. Game-ending if sustained.

### Oxygen (Blue)
- **Source**: Electrolysis system (splits water into O2 and H2). Requires energy to run.
- **Drain**: Crew breathing, airlock cycling, leaks
- **Critical at**: Below 20% -- crew gets headaches, slower movement
- **Zero**: Emergency oxygen reserves give 1 day to fix the problem

### Shielding (Purple)
- **Source**: Electromagnetic shield array. Requires energy to maintain.
- **Drain**: Solar storms degrade shielding. Micrometeorite impacts.
- **Critical at**: Below 20% -- radiation exposure increases, crew health drops
- **Zero**: Crew must shelter in the most protected room. Science and EVA impossible.

### Interconnection Rules
- Low energy (below 30%) causes oxygen generation to slow (-2 O2/day extra drain)
- Low energy (below 30%) causes shield strength to decay (-1 shielding/day)
- Low oxygen (below 30%) reduces crew effectiveness (tasks take longer)
- Low shielding (below 30%) reduces crew health over time
- Multiple low resources compound: two resources below 20% triggers emergency protocol

## Game Loop

Each in-game day follows this structure:

### 1. Morning Briefing (Bridge)
- Day counter updates
- Resource summary shown
- Any overnight events reported
- Crew status check

### 2. Explore Station (Free movement)
- Walk through rooms
- Talk to crew members
- Check systems
- Optional tasks (boost morale, check supplies, run scans)

### 3. Mission Event (Triggered)
- A mission event fires (scripted per day or triggered by conditions)
- Player receives briefing on the situation
- 2-3 choices presented with visible trade-offs

### 4. Make Choice
- Player selects their response
- Crew member reacts based on the choice
- Resources change immediately (shown with animation)

### 5. See Result
- Outcome narrative plays
- NASA educational popup appears (real science behind the event)
- Any lasting effects are noted

### 6. Day Summary
- Resource changes for the day
- Crew status updates
- Preview hint for next day
- Day ends, next day begins

## Missions

13 missions inspired by real NASA incidents. Each mission has a name, the real incident it references, 2-3 player choices, and a NASA educational fact.

### Act 1 Missions (Days 1-30) -- "All Systems Go"

**Mission 1: Power Fluctuation (Day 3)**
- Based on: ISS solar panel deployment issues
- Situation: Solar panel alignment is off. Power dropping slowly.
- Choice A: Kira does EVA to fix manually (risk to Kira, costs oxygen, guaranteed fix)
- Choice B: Software recalibration from inside (safe, but only 70% effective)
- Choice C: Reduce power usage station-wide (safe, but limits operations for 3 days)
- NASA Fact: The ISS has 8 solar arrays spanning 73 meters, generating up to 120 kW.

**Mission 2: Micrometeorite Alert (Day 7)**
- Based on: ISS Soyuz coolant leak (2022)
- Situation: Small object detected on collision course.
- Choice A: Activate emergency shields (high energy cost)
- Choice B: Maneuver station slightly (moderate energy, risks equipment)
- NASA Fact: The ISS performs debris avoidance maneuvers about once a year.

**Mission 3: Crew Morale Dip (Day 12)**
- Based on: Skylab crew strike (1973)
- Situation: Crew is overworked. Morale dropping.
- Choice A: Day off for everyone (lose a work day)
- Choice B: Movie night in Common Room (small morale boost, no lost time)
- Choice C: Push through (morale drops further, but tasks complete)
- NASA Fact: NASA schedules crew free time carefully. The Skylab 4 crew famously took an unscheduled day off.

**Mission 4: Water Recycler Malfunction (Day 18)**
- Based on: ISS water recovery system issues
- Situation: Water recycler is producing less than expected.
- Choice A: Kira repairs immediately (she's unavailable for 2 days)
- Choice B: Ration water (oxygen production slows)
- NASA Fact: The ISS recycles about 90% of all water, including sweat and urine.

**Mission 5: Mysterious Signal (Day 25)**
- Based on: Wow! Signal and SETI research
- Situation: Maya detects an unusual signal from Mars surface.
- Choice A: Dedicate research time (uses energy for sensors)
- Choice B: Log and report to Earth (no cost, but no immediate answer)
- NASA Fact: Scientists use radio telescopes to search for signals from space. The "Wow!" signal of 1977 remains unexplained.

### Act 2 Missions (Days 31-60) -- "Things Complicate"

**Mission 6: Solar Storm Warning (Day 33)**
- Based on: Carrington Event, real DONKI data
- Situation: DONKI data shows incoming coronal mass ejection.
- Choice A: Maximum shields (drains 30 energy)
- Choice B: Shelter in place and reduce exposure (crew stuck in quarters for 2 days)
- Choice C: Partial shields + shelter (moderate of both)
- NASA Fact: Solar storms can damage electronics and are dangerous for astronauts outside Earth's magnetosphere. NASA's DONKI system tracks them in real time.

**Mission 7: Fire in Engineering (Day 38)**
- Based on: MIR space station fire (1997)
- Situation: Electrical fire in Engineering. Smoke spreading.
- Choice A: Seal Engineering and vent atmosphere (kills fire, loses oxygen)
- Choice B: Kira fights fire manually (risk to Kira, slower)
- Choice C: Activate fire suppression system (uses emergency chemicals, Engineering offline 3 days)
- NASA Fact: In 1997, a fire broke out on MIR when an oxygen-generating canister malfunctioned. The crew fought it with wet towels.

**Mission 8: Communication Blackout (Day 44)**
- Based on: Mars communication delays and conjunction blackouts
- Situation: Mars is entering a position where Earth communication is degraded.
- Choice A: Send all pending data now (high energy burst)
- Choice B: Store data for later (risk of data loss if systems fail)
- NASA Fact: When Mars is on the opposite side of the Sun from Earth (solar conjunction), communication is impossible for about 2 weeks.

**Mission 9: Oxygen Generator Failure (Day 50)**
- Based on: Apollo 13 CO2 scrubber crisis
- Situation: Primary O2 generator fails. Backup running but insufficient.
- Choice A: Kira attempts field repair (risky, could make it worse)
- Choice B: Leo rigs a medical oxygen supply as backup (temporary, drains medical supplies)
- Choice C: Reduce crew activity to minimum (slows oxygen consumption)
- NASA Fact: During Apollo 13, astronauts had to build a makeshift CO2 scrubber from spare parts using only materials on board.

### Act 3 Missions (Days 61-90) -- "Survive"

**Mission 10: Hull Breach Scare (Day 63)**
- Based on: ISS pressure leak (2018)
- Situation: Pressure sensors detect a slow leak somewhere in the station.
- Choice A: Systematic room-by-room search (slow but thorough)
- Choice B: Kira uses ultrasonic detector (faster but uses equipment that might be needed later)
- NASA Fact: In 2018, a small hole was found in the ISS Soyuz module. The crew temporarily sealed it with a finger, then epoxy.

**Mission 11: Dust Storm on Mars (Day 70)**
- Based on: Mars global dust storm (2018, killed Opportunity rover)
- Situation: Massive dust storm reduces solar panel efficiency by 60%.
- Choice A: Hibernate non-essential systems (survive on minimal power)
- Choice B: Use backup batteries (limited supply, full operations for 5 days)
- Choice C: Maya calculates storm duration (uses energy for sensors, better planning)
- NASA Fact: In 2018, a planet-wide dust storm on Mars blocked so much sunlight that the Opportunity rover lost power permanently after 15 years of service.

**Mission 12: Crew Medical Emergency (Day 78)**
- Based on: Medical emergencies in space (real ISS protocols)
- Situation: A crew member has a medical issue. Leo needs resources.
- Choice A: Full medical response (uses supplies, Leo unavailable for 3 days)
- Choice B: Basic treatment (lower supply cost, crew member at reduced capacity)
- NASA Fact: Astronauts on the ISS receive basic medical training. The nearest hospital is 250 miles straight down.

**Mission 13: The Final Storm (Day 85)**
- Based on: Multiple compounding failures (Apollo 13 style)
- Situation: Everything goes wrong at once. Solar storm + equipment failure + low resources.
- Choice A: All hands emergency protocol (everyone works together, risky but heroic)
- Choice B: Calculated triage (sacrifice some systems to save others)
- Choice C: Send distress signal and wait (hope for the best)
- NASA Fact: Real space emergencies often involve multiple failures happening at once. Astronaut training focuses on staying calm and prioritizing.

## Three-Act Structure

### Act 1: "All Systems Go" (Days 1-30)
- **Difficulty**: Easy. Forgiving resource costs. Tutorial elements.
- **Tone**: Exciting, optimistic. The crew is fresh and eager.
- **Purpose**: Teach mechanics. Let player learn movement, interaction, resource management.
- **Missions**: 5 missions with clear "best" choices and gentle consequences.
- **Resources**: Start at 80-90%. Drain slowly. Easy to recover.

### Act 2: "Things Complicate" (Days 31-60)
- **Difficulty**: Medium to hard. Real trade-offs. No clearly "right" answer.
- **Tone**: Tense but determined. Crew bonds deepen through adversity.
- **Purpose**: Challenge player decisions. Introduce compounding effects.
- **Missions**: 4 missions with meaningful trade-offs. Past choices affect options.
- **Resources**: Typically 40-70%. Harder to recover. Drain accelerates.

### Act 3: "Survive" (Days 61-90)
- **Difficulty**: Hard to critical. Every choice matters.
- **Tone**: Intense but hopeful. Crew pulls together or falls apart based on prior decisions.
- **Purpose**: Test mastery. Bring emotional payoff.
- **Missions**: 4 missions including the final compounding crisis.
- **Resources**: Often 20-50%. Recovery very limited. Every point counts.

## Endings

Determined by average resource levels and crew status on Day 45 (or Day 37 with the early return). A game over before that ends the mission early (see below).

### Good Ending: "Mission Complete" (Average resources > 30%)
- The crew celebrates. Earth congratulates the Commander.
- Each crew member shares what they learned.
- Player gets a mission report card with stats.
- Message: "You kept your crew safe and your station running. Real commanders make the same tough choices every day."

### Medium Ending: "We Made It" (Average resources 10-30%)
- The crew is exhausted but alive. Station is battered but functional.
- Crew members reflect on the hardships.
- Player sees what could have gone better.
- Message: "It was tough, but you brought everyone home. Sometimes survival is the victory."

### Bad Ending: "Emergency Evacuation" (Average resources < 10%)
- The station is failing. Emergency evacuation protocol triggered.
- Crew escapes but the mission is cut short.
- Player sees what went wrong.
- Message: "Every mission teaches us something. The best commanders learn from failure and try again."
- Note: Even the "bad" ending is NOT scary or punishing. The crew survives. The tone is encouraging.

## Game Over and Survival Rules (team rules, 2026-11-15)

All numbers live in `src/data/difficulty.ts`; the rules run every morning in `src/engine/survival.ts`.

### Game over: the station is lost
- **Oxygen at 0**: game over that same day.
- **Health at 0**: game over.
- **Radiation at 100**: game over (everyone must leave).
- Water, food and energy at 0 are not instant game over, but their chain failures (below) end the game in a few days.
- Tone stays gentle: the crew always escapes safely in the capsule; the station is what is lost.
- The game-over screen shows the cause, what was hurting the station, the 3 decisions that cost the most, a real NASA story and a tip.
- "Try again from Day X" goes back to the start of the current act (Day 1, 16 or 31). "Start a new mission" starts over.

### Chain failures (every day while the bar is in danger)
| Situation | Effect per day |
|---|---|
| Energy at 0 | Oxygen −25, water −25 (life support stops) |
| Oxygen below 20 | Health −25 |
| Water below 30 | Health −3 and **water saving** turns on |
| Water at 0 | Health −20 |
| Food below 20 | Health −3 and **food rationing** turns on |
| Food at 0 | Health −20, tiredness +40% (chance per person per day) |
| Radiation above 70 | Health −3, +30% chance that someone gets sick |
| Health below 30 | 30% chance that someone gets sick |

### Protocols (turn on and off by themselves)
- **Water saving** (water < 30, off at 40): half the daily water use, no showers (satisfaction −1 per day).
- **Food rationing** (food < 20, off at 30): half the daily food use, satisfaction −1 per day, 20% chance per person per day of getting more tired.

### Weight of decisions
- Losses of the chosen option are ×1.5 the numbers written in `missoes.txt` (gains stay as written). Side risks, "deal with it tomorrow", lasting conditions and delayed effects keep their written numbers, because their texts state them.
- A failed job costs ×1.25 more on top of that, and tires everyone on it one extra step.
- Daily use of a crew of four: food −1, water −1, oxygen −0.5, satisfaction −0.3, radiation +0.5.

### Personal radiation dose
- The personal dose bar maps to NASA's career limit of **600 mSv** (since 2022, the same for every astronaut; it keeps the risk of radiation-induced cancer death under 3%). 1 point = 6 mSv. At 600 mSv the crew member goes back to Earth.

## NASA Data Integration

### DONKI (Space Weather)
- Real solar storm data from NASA's DONKI API feeds into Mission 6 (Solar Storm Warning)
- If real CME data is available, the game references it: "NASA detected a real solar storm today!"
- Fallback to scripted data if API is unavailable

### APOD (Astronomy Picture of the Day)
- Used as "Letters from Earth" -- the crew receives a daily image from NASA
- Shown in the Common Room or Bridge as a morale-boosting interaction
- Real APOD title and explanation displayed in kid-friendly format

## Target Audience Guidelines

- **Age**: 7-12 years old
- **Reading level**: Simple English. Short sentences. Max 2 sentences per dialogue bubble.
- **Icons over text**: Every important concept has a visual icon (energy = lightning bolt, oxygen = wind/bubbles, shielding = shield)
- **No death or graphic content**: Crew is never in mortal danger visually. Consequences are about mission success, not survival horror.
- **Color coding**: Every system and crew member has a consistent color. Players learn to associate color with meaning.
- **Touch-friendly**: All interactive elements are large enough for touch/click (min 60x60px)
- **Encouraging tone**: Even failures include encouragement. "Good try! Here's what real astronauts would do..."
- **Educational popups**: After every mission, a brief NASA fact appears. Optional but rewarding to read.
