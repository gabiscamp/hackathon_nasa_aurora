# Missions in the game

Map of the team's `missoes.txt` to the game (`src/data/missionsBatch1.ts` … `missionsBatch6.ts`).
`M` = "Missões detalhadas" (first part of the file), `P` = "problemas" (second part; their numbers come from the file's own references).
Rooms follow the room guide at the end of `missoes.txt`. Days follow the 45-day mission (`src/data/missionLength.ts`).

| missoes.txt | id | Title in the game | When | Room | Batch |
|---|---|---|---|---|---|
| M1 | `co2-filter-broke` | The Broken Filter | Day 34 | `engineering` | 1 |
| M2 | `fire-on-station` | Fire on the Station! | Day 36 | `engineering` | 1 |
| M3 | `supply-ship-crash` | Crash! | Day 26 | `storage` | 1 |
| M4 | `invisible-leak` | The Invisible Leak | Day 5 | `engineering` | 1 |
| M5 | `toxic-air` | Toxic Air! | Day 18 | `engineering` | 1 |
| M6 | `slow-problem` | The Slow Problem | Day 10 | `airlock` | 1 |
| M7 | `bathroom-broke` | The Bathroom Broke | Day 3 | `bathroom` | 1 |
| M8 | `dirty-water` | Dirty Water | Day 20 | `engineering` | 1 |
| M9 | `water-in-helmet` | Water in the Helmet! | Day 28 | `airlock` | 1 |
| M10 | `micrometeorite-hole` | Finger in the Hole | Day 38 | `airlock` | 1 |
| M11 | `debris-storm` | Debris Storm! | Day 14 | `bridge` | 2 |
| M12 | `radio-silence` | Total Silence | Day 23 | `bridge` | 2 |
| M13 | `food-running-low` | Food Running Low | Day 30 | `storage` | 2 |
| P1 | `crew-sick` | A Crew Member Is Sick | set off by another choice | `gym` | 2 |
| P2 | `crew-very-sick` | Very Sick! | set off by another choice | `gym` | 2 |
| P3 | `mission-pantry` | The Mission Pantry | Day 1 | `storage` | 2 |
| P4 | `pantry-shield` | Food as a Shield | Day 15 | `storage` | 2 |
| P5 | `food-old-or-new` | Old Food or New Food? | Day 9, every 7 days | `storage` | 2 |
| P6 | `portion-size` | How Much Do We Eat? | Day 2, every 14 days | `common` | 2 |
| P7 | `greenhouse-shadow` | Greenhouse in the Shadow | Day 6 | `greenhouse` | 2 |
| P8 | `first-harvest` | The First Harvest | Day 12 | `greenhouse` | 3 |
| P9 | `low-vitamins` | Not Enough Vitamins | Day 17 | `gym` | 3 |
| P10 | `birthday-on-station` | Birthday on the Station! | Day 29 | `common` | 3 |
| P11 | `who-eats-more` | Who Eats More? | when food < 20 | `common` | 3 |
| P12 | `trash-piling-up` | Trash Piling Up | Day 10, every 10 days | `storage` | 3 |
| P13 | `leftovers` | Leftovers | Day 7, every 8 days | `common` | 3 |
| P14 | `kitchen-heater` | The Kitchen Heater Broke | Day 22 | `common` | 3 |
| P15 | `pantry-count` | The Pantry Count Doesn't Add Up | Day 13 | `storage` | 3 |
| P16 | `garden-hobby` | Gardening for Fun | Day 11 | `greenhouse` | 3 |
| P17 | `drink-or-air` | Drink It or Breathe It? | when water < 35 | `engineering` | 3 |
| P18 | `urine-recycler` | The Pee Recycler Stopped | Day 19 | `bathroom` | 4 |
| P19 | `bath-day` | Bath Time | Day 4, every 5 days | `bathroom` | 4 |
| P20 | `water-slowly-lost` | Water Slowly Disappearing | Day 25 | `engineering` | 4 |
| P21 | `thirsty-greenhouse` | The Plants Are Thirsty | Day 27 | `greenhouse` | 4 |
| P22 | `contamination-alert` | Contamination Alert | Day 33 | `engineering` | 4 |
| P23 | `water-shield` | Water as a Shield | Day 37 | `storage` | 4 |
| P24 | `pipe-leak` | Leak in the Machine Room | Day 26 | `engineering` | 4 |
| P25 | `toilet-clogged` | The Toilet Is Clogged | Day 35 | `bathroom` | 4 |
| P26 | `water-rationing` | Ration the Water? | when water < 40 | `engineering` | 4 |
| P27 | `mars-shadow` | Mars' Shadow Is Coming | Day 6, every 12 days | `bridge` | 4 |
| P28 | `power-plant` | Choose the Power Plant | Day 1 | `bridge` | 5 |
| P29 | `spend-or-save` | Spend It Now or Save It? | Day 4 | `lab` | 5 |
| P30 | `survival-mode` | Survival Mode? | when energy < 20 | `engineering` | 5 |
| P31 | `which-modules-heat` | Which Modules Do We Heat? | Day 8, every 9 days | `engineering` | 5 |
| P32 | `what-comes-first` | What Comes First? | Day 21 | `bridge` | 5 |
| P33 | `battery-aged` | The Battery Got Old | Day 30 | `engineering` | 5 |
| P34 | `lab-night-shift` | Extra Shift in the Lab | Day 16 | `lab` | 5 |
| P35 | `stuck-solar-panel` | Stuck Solar Panel | Day 31 | `airlock` | 5 |
| P36 | `solar-storm-warning` | A Storm Left the Sun! | Day 8 | `bridge` | 5 |
| P37 | `outside-repair` | Outside Repair Before the Storm | Day 27 | `airlock` | 5 |
| P38 | `storm-shelter-day` | A Whole Day in the Shelter | Day 16 | `bridge` | 6 |
| P39 | `near-dose-limit` | Close to the Limit | when a dose reaches 50 | `gym` | 6 |
| P40 | `calm-sun` | The Sun Is Calm | Day 33 | `airlock` | 6 |
| P41 | `radiation-sensor` | The Radiation Sensor Broke | Day 28 | `bridge` | 6 |
| P42 | `cosmic-rays` | Cosmic Rays Every Day | Day 20 | `bridge` | 6 |
| P43 | `who-goes-outside` | Who Goes Outside? | Day 24 | `airlock` | 6 |
| P44 | `trash-wall` | A Wall Made of Trash | Day 36 | `storage` | 6 |
| P45 | `measure-storm` | Measure the Storm | Day 9 | `airlock` | 6 |
| P46 | `family-message` | Messages from Home | Day 13, every 10 days | `common` | 6 |

## Follow-up missions

Extra missions that only happen because of an earlier choice (a temporary fix that fails, an interrupted repair, a repair postponed).

| id | Title | Room | Batch |
|---|---|---|---|
| `toilet-fix` | Fix the Toilet | `bathroom` | 1 |
| `water-recycler-repair` | Repair the Water Recycler | `bathroom` | 1 |
| `leak-lockdown` | Lockdown: Find the Leak | `engineering` | 1 |
| `coolant-leak-urgent` | The Leak Got Worse | `airlock` | 1 |
| `o2-machine-repair` | Repair the Oxygen Machine | `engineering` | 1 |
| `o2-filter-clogged` | Clogged Oxygen Filter | `engineering` | 1 |
| `recycler-repair-finish` | Finish the Recycler Repair | `engineering` | 1 |
| `finish-outside-repair` | Finish the Outside Repair | `airlock` | 1 |
| `patch-failing` | The Patch Is Hissing | `airlock` | 1 |
| `co2-filter-fix` | Fix the CO2 Filter | `engineering` | 1 |
| `kitchen-heater-later` | Fix the Kitchen Heater | `common` | 3 |
| `bags-run-out` | The Backup Bags Ran Out | `bathroom` | 4 |
| `pipe-burst` | The Pipe Burst! | `engineering` | 4 |
| `outside-repair-later` | The Storm Has Passed | `airlock` | 5 |
| `outside-repair-retry` | Try the Outside Repair Again | `airlock` | 6 |

## Not written yet in missoes.txt

The file refers to three problems that do not exist yet. The choices that lead to them already leave a mark, ready for when the team writes them:

| Problem | Referred to by | Mark left in the game |
|---|---|---|
| P47 "Cama emperrada" | P34 (extra lab shift, 20%) | flag `bed-stuck` |
| P48 "O tédio chegou" | P46 ("only work messages" twice) | counter `work-only-messages` |
| P49 (no title) | P10, P11, P14, P25 (bad days for morale) | flag `bad-morale-days` |

## Other missions

Missions written before `missoes.txt` (in `src/data/missions.ts`, `MISSIONS_BASE`) that are not in the file still run with the default crew rule (1-2 people).

| id | Title | When | Room |
|---|---|---|---|
| `crew-not-sleeping` | Crew Not Sleeping Well | Day 19 | `quarters` |
| `crew-fight` | Crew Fight | Day 24 | `common` |
| `morale-at-limit` | Morale at the Limit | Day 25 | `common` |
| `earth-message` | Message from Earth | Day 33 | `bridge` |
| `o2-machine-stopped` | O2 Machine Stopped! | Day 35 | `engineering` |
| `maya-discovery` | Maya's Discovery | Day 39 | `lab` |
| `transmit-or-save` | Transmit or Save Energy? | Day 43 | `bridge` |
| `countdown-begins` | Countdown Begins | Day 44 | `bridge` |
| `final-day` | The Final Day | Day 45 | `bridge` |
