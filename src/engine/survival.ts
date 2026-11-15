import type { ChoiceEffect } from '../data/missions';
import {
  DAILY_USE,
  FAIL_LOSS_WEIGHT,
  HEALTH_GAME_OVER,
  HIGH_RADIATION,
  HIGH_RADIATION_HEALTH_LOSS,
  HIGH_RADIATION_SICK_CHANCE,
  LOSS_WEIGHT,
  LOW_FOOD,
  LOW_FOOD_HEALTH_LOSS,
  LOW_HEALTH,
  LOW_HEALTH_SICK_CHANCE,
  LOW_OXYGEN,
  LOW_OXYGEN_HEALTH_LOSS,
  LOW_WATER,
  LOW_WATER_HEALTH_LOSS,
  NO_ENERGY_OXYGEN_LOSS,
  NO_ENERGY_WATER_LOSS,
  NO_FOOD_FATIGUE_CHANCE,
  NO_FOOD_HEALTH_LOSS,
  NO_WATER_HEALTH_LOSS,
  OXYGEN_GAME_OVER,
  PROTOCOLS,
  RADIATION_GAME_OVER,
  RATIONING_FATIGUE_CHANCE,
  type ProtocolRule,
} from '../data/difficulty';
import { useMissionStore, type Collapse, type CollapseCause } from '../stores/useMissionStore';
import { CREW_SLOTS, FATIGUE_EXHAUSTED, useDutyStore } from '../stores/useDutyStore';
import { useResourceStore, type ResourceKey, type Resources } from '../stores/useResourceStore';
import { rollSuccess } from '../utils/random';

/**
 * Survival rules (team rules, 2026-11-15): what the station uses every day, chain failures,
 * the water-saving and food-rationing protocols, and game over. All numbers: src/data/difficulty.ts.
 */

type Delta = Partial<Record<ResourceKey, number>>;

const round1 = (n: number) => Math.round(n * 10) / 10;

/** A change that hurts: a bar going down, or radiation going up. */
function isLoss(resource: ResourceKey, delta: number): boolean {
  return resource === 'radiation' ? delta > 0 : delta < 0;
}

/** Makes the losses of a decision heavier (gains stay as written). */
export function weigh(effects: ChoiceEffect[], failed = false): ChoiceEffect[] {
  const w = LOSS_WEIGHT * (failed ? FAIL_LOSS_WEIGHT : 1);
  return effects.map((e) => (isLoss(e.resource, e.delta) ? { ...e, delta: round1(e.delta * w) } : e));
}

function add(delta: Delta, resource: ResourceKey, value: number): void {
  delta[resource] = (delta[resource] ?? 0) + value;
}

export function isProtocolOn(id: ProtocolRule['id']): boolean {
  return useMissionStore.getState().protocols.includes(id);
}

/** The protocols that are on right now. */
export function activeProtocols(): ProtocolRule[] {
  const on = useMissionStore.getState().protocols;
  return PROTOCOLS.filter((p) => on.includes(p.id));
}

/** Turns protocols on and off by the bars. Returns the news lines. */
function updateProtocols(r: Resources): string[] {
  const news: string[] = [];
  let on = [...useMissionStore.getState().protocols];
  for (const p of PROTOCOLS) {
    const active = on.includes(p.id);
    if (!active && r[p.resource] < p.onBelow) {
      on = [...on, p.id];
      news.push(p.startNews);
    } else if (active && r[p.resource] >= p.offAtOrAbove) {
      on = on.filter((id) => id !== p.id);
      news.push(p.endNews);
    }
  }
  useMissionStore.setState({ protocols: on });
  return news;
}

/**
 * The chain failures that hurt the station right now, as daily changes (no mission included).
 * Used to apply a day and to warn the player ("about 2 days left").
 */
export function chainEffects(r: Resources): { delta: Delta; reasons: string[] } {
  const delta: Delta = {};
  const reasons: string[] = [];
  if (r.energy <= 0) {
    add(delta, 'oxygen', NO_ENERGY_OXYGEN_LOSS);
    add(delta, 'water', NO_ENERGY_WATER_LOSS);
    reasons.push('Energy ran out: the oxygen machine and the water recycler stopped.');
  }
  if (r.oxygen > 0 && r.oxygen < LOW_OXYGEN) {
    add(delta, 'health', LOW_OXYGEN_HEALTH_LOSS);
    reasons.push(`Oxygen was below ${LOW_OXYGEN}: the crew could hardly breathe.`);
  }
  if (r.water <= 0) {
    add(delta, 'health', NO_WATER_HEALTH_LOSS);
    reasons.push('There was no water left to drink.');
  } else if (r.water < LOW_WATER) {
    add(delta, 'health', LOW_WATER_HEALTH_LOSS);
    reasons.push(`Water was below ${LOW_WATER}: the crew was thirsty.`);
  }
  if (r.food <= 0) {
    add(delta, 'health', NO_FOOD_HEALTH_LOSS);
    reasons.push('There was no food left.');
  } else if (r.food < LOW_FOOD) {
    add(delta, 'health', LOW_FOOD_HEALTH_LOSS);
    reasons.push(`Food was below ${LOW_FOOD}: everyone was hungry.`);
  }
  if (r.radiation > HIGH_RADIATION) {
    add(delta, 'health', HIGH_RADIATION_HEALTH_LOSS);
    reasons.push(`Radiation was above ${HIGH_RADIATION}: it made the crew weak.`);
  }
  return { delta, reasons };
}

/** What the station uses in a normal day, with the protocols that are on. */
function dailyUse(): Delta {
  const delta: Delta = {};
  const protocols = activeProtocols();
  for (const [k, v] of Object.entries(DAILY_USE) as [ResourceKey, number][]) {
    const p = protocols.find((x) => x.resource === k);
    add(delta, k, v * (p ? p.useFactor : 1));
  }
  for (const p of protocols) for (const [k, v] of Object.entries(p.daily) as [ResourceKey, number][]) add(delta, k, v);
  return delta;
}

/** Expected change of a bar per day without missions (negative = going down). */
export function dailyTrend(resource: ResourceKey, r: Resources = useResourceStore.getState()): number {
  return (dailyUse()[resource] ?? 0) + (chainEffects(r).delta[resource] ?? 0);
}

/** Days until a vital bar reaches its game-over line at today's pace (null = not going down). */
export function daysLeft(resource: 'oxygen' | 'health', r: Resources = useResourceStore.getState()): number | null {
  const trend = dailyTrend(resource, r);
  if (trend >= 0) return null;
  return Math.max(0, Math.ceil(r[resource] / -trend));
}

/**
 * One day of living on the station (applied the next morning, for every day, skipped days too):
 * protocols switch, the crew uses food/water/air, and the chain failures hurt. Returns news lines.
 */
export function liveOneDay(): string[] {
  const news = updateProtocols(useResourceStore.getState());
  useResourceStore.getState().applyDelta(dailyUse());
  const r = useResourceStore.getState();
  const { delta } = chainEffects(r);
  if (Object.keys(delta).length) useResourceStore.getState().applyDelta(delta);

  // Hungry crews get tired faster: rationing a little, no food at all a lot.
  const tiredChance = r.food <= 0 ? NO_FOOD_FATIGUE_CHANCE : isProtocolOn('food-rationing') ? RATIONING_FATIGUE_CHANCE : 0;
  if (tiredChance > 0) {
    for (const s of CREW_SLOTS) {
      const d = useDutyStore.getState().crew[s];
      if (d.goneHome || !rollSuccess(tiredChance)) continue;
      useDutyStore.getState().setDuty(s, { fatigue: Math.min(FATIGUE_EXHAUSTED, d.fatigue + 1) });
    }
  }

  const after = useResourceStore.getState();
  if (after.energy <= 0) news.push('BLACKOUT! Energy is at 0: oxygen and water drop fast every day. Get energy back NOW!');
  if (after.oxygen > 0 && after.oxygen < LOW_OXYGEN) news.push(`DANGER! Oxygen is below ${LOW_OXYGEN}: everyone loses a lot of health every day. If oxygen reaches 0, the station is lost.`);
  if (after.water <= 0) news.push('DANGER! There is no water: everyone loses a lot of health every day.');
  if (after.food <= 0) news.push('DANGER! There is no food: everyone loses a lot of health and gets very tired.');
  if (after.health > 0 && after.health < LOW_HEALTH) news.push(`DANGER! Crew health is below ${LOW_HEALTH}. If it reaches 0, the station is lost.`);
  return news;
}

/** Chance (%) today that someone gets sick: weak crew, high radiation, or both. */
export function sickChanceToday(r: Resources = useResourceStore.getState()): number {
  return (r.health < LOW_HEALTH ? LOW_HEALTH_SICK_CHANCE : 0) + (r.radiation > HIGH_RADIATION ? HIGH_RADIATION_SICK_CHANCE : 0);
}

/** Game over check: oxygen or health at 0, or radiation at 100. Saves and returns the collapse. */
export function checkCollapse(day: number): Collapse | null {
  const existing = useMissionStore.getState().collapse;
  if (existing) return existing;
  const r = useResourceStore.getState();
  let cause: CollapseCause | null = null;
  if (r.oxygen <= OXYGEN_GAME_OVER) cause = 'oxygen';
  else if (r.health <= HEALTH_GAME_OVER) cause = 'health';
  else if (r.radiation >= RADIATION_GAME_OVER) cause = 'radiation';
  if (!cause) return null;
  const collapse: Collapse = { cause, day, reasons: chainEffects(r).reasons };
  useMissionStore.setState({ collapse });
  return collapse;
}
