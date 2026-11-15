import type { ResourceKey } from '../stores/useResourceStore';

/**
 * Every number that sets how hard the game is, in one place (team rules, 2026-11-15).
 * Change these to tune the game while testing: nothing else needs to be edited.
 */

// ───────── Weight of decisions ─────────

/**
 * Losses from mission choices are bigger than the numbers written in missoes.txt.
 * Only losses (resources going down, radiation going up): gains stay the same, so a careful
 * choice still pays off and a careless one hurts more.
 * Used for: choice effects, side risks, "deal with it tomorrow", lasting conditions and delayed effects.
 */
export const LOSS_WEIGHT = 1.5;
/** A failed job costs more than the written failure (on top of LOSS_WEIGHT). */
export const FAIL_LOSS_WEIGHT = 1.25;
/** A failed job also tires everyone on it a bit more (send rested people to hard jobs). */
export const FAIL_EXTRA_FATIGUE = 1;

// ───────── What the station uses every day ─────────

/** Daily use of a crew of four, before any protocol. Radiation goes UP every day. */
export const DAILY_USE: Partial<Record<ResourceKey, number>> = {
  food: -1,
  water: -1,
  oxygen: -0.5,
  satisfaction: -0.3,
  radiation: 0.5,
};

// ───────── Game over: when the station is lost ─────────

/** Oxygen at 0: the station is lost that same day. */
export const OXYGEN_GAME_OVER = 0;
/** Crew health at 0: the station is lost. */
export const HEALTH_GAME_OVER = 0;
/** Radiation at 100: the station must be left. */
export const RADIATION_GAME_OVER = 100;

// ───────── Chain failures (every day, while the bar is in danger) ─────────

/** Energy at 0: life support stops. Oxygen and water fall this much every day. */
export const NO_ENERGY_OXYGEN_LOSS = -25;
export const NO_ENERGY_WATER_LOSS = -25;

/** Oxygen below this: everyone loses health every day. */
export const LOW_OXYGEN = 20;
export const LOW_OXYGEN_HEALTH_LOSS = -25;

/** Water below this: health loss and the water-saving protocol. */
export const LOW_WATER = 30;
export const LOW_WATER_HEALTH_LOSS = -3;
export const NO_WATER_HEALTH_LOSS = -20;

/** Food below this: health loss and food rationing. */
export const LOW_FOOD = 20;
export const LOW_FOOD_HEALTH_LOSS = -3;
export const NO_FOOD_HEALTH_LOSS = -20;
/** Chance (%) per crew member per day of getting one step more tired. */
export const RATIONING_FATIGUE_CHANCE = 20;
/** No food at all: tiredness grows 40% (chance per crew member per day). */
export const NO_FOOD_FATIGUE_CHANCE = 40;

/** Radiation above this: health loss and a higher chance of getting sick. */
export const HIGH_RADIATION = 70;
export const HIGH_RADIATION_HEALTH_LOSS = -3;
export const HIGH_RADIATION_SICK_CHANCE = 30;

/** Health below this: 30% chance per day that someone gets sick (missoes.txt). */
export const LOW_HEALTH = 30;
export const LOW_HEALTH_SICK_CHANCE = 30;

// ───────── Protocols (turn on by themselves, turn off when the bar is safe again) ─────────

export interface ProtocolRule {
  id: 'water-saving' | 'food-rationing';
  resource: ResourceKey;
  /** Turns on when the bar is below this. */
  onBelow: number;
  /** Turns off when the bar is back at or above this. */
  offAtOrAbove: number;
  /** Daily use of `resource` is multiplied by this while it is on. */
  useFactor: number;
  /** Extra daily change while it is on (the price of saving). */
  daily: Partial<Record<ResourceKey, number>>;
  label: string;
  /** Shown in the HUD and the day summary. */
  short: string;
  startNews: string;
  endNews: string;
}

export const PROTOCOLS: readonly ProtocolRule[] = [
  {
    id: 'water-saving',
    resource: 'water',
    onBelow: LOW_WATER,
    offAtOrAbove: 40,
    useFactor: 0.5,
    daily: { satisfaction: -1 },
    label: 'Water saving',
    short: 'Water saving: half the water use, no showers.',
    startNews: 'WATER SAVING ON: water is low. No showers, short washes, and the recycler works non-stop. The crew uses half the water, but nobody is happy about it.',
    endNews: 'Water saving is over: there is enough water again.',
  },
  {
    id: 'food-rationing',
    resource: 'food',
    onBelow: LOW_FOOD,
    offAtOrAbove: 30,
    useFactor: 0.5,
    daily: { satisfaction: -1 },
    label: 'Food rationing',
    short: 'Food rationing: half portions, everyone gets tired faster.',
    startNews: 'FOOD RATIONING ON: food is low. Everyone eats half portions. The food lasts longer, but the crew gets tired faster.',
    endNews: 'Food rationing is over: full meals again!',
  },
];

// ───────── Radiation, in real units ─────────

/** NASA career limit (2022): 600 mSv for every astronaut. The personal dose bar (0-100) maps to it. */
export const CAREER_LIMIT_MSV = 600;
export const MSV_PER_DOSE_POINT = CAREER_LIMIT_MSV / 100;
