import {
  DEFAULT_CREW_NEED,
  MISSIONS,
  getMission,
  type Choice,
  type ChoiceEffect,
  type CrewNeed,
  type CrewSlot,
  type FollowUp,
  type Mission,
  type Outcome,
} from '../data/missions';
import { useMissionStore, type ActiveCondition } from '../stores/useMissionStore';
import {
  CREW_SLOTS,
  FATIGUE_EXHAUSTED,
  FATIGUE_TIRED,
  FATIGUE_VERY_TIRED,
  availability,
  useDutyStore,
  type CrewDuty,
  type DutyTask,
} from '../stores/useDutyStore';
import { useResourceStore, type ResourceKey } from '../stores/useResourceStore';
import { useCrewStore } from '../stores/useCrewStore';
import { applyEffects } from './resourceEngine';
import { rollSuccess, seededRandom } from '../utils/random';
import { clamp } from '../utils/clamp';
import { MISSION_DAYS } from '../data/missionLength';

/**
 * Mission engine: crew assignment, multi-day jobs, tiredness, station conditions and
 * chained consequences. Extends the original one-mission-per-day system (eventResolver)
 * instead of replacing it: missions without the new fields still work, with DEFAULT_CREW_NEED.
 */

/** A specialist on the job (the "Best:" role). */
export const SPECIALIST_BONUS = 15;
/** Spare parts saved from the Cargo Bay make engineering repairs easier. */
export const SPARE_PARTS_BONUS = 10;
/** Per tired / very tired person on a risky job. */
export const TIRED_PENALTY = 10;
export const VERY_TIRED_PENALTY = 15;
/** Per missing person when a job is tried with fewer people. */
export const MISSING_PENALTY = 20;

const MISSION_LAST_DAY = MISSION_DAYS;

export function crewNeed(choice: Choice): CrewNeed {
  return choice.crew ?? DEFAULT_CREW_NEED;
}

function stores() {
  return { mission: useMissionStore.getState(), duty: useDutyStore.getState() };
}

// ───────────────────────── Choices ─────────────────────────

export interface ChoiceState {
  hidden: boolean;
  /** Why it can't be picked right now (shown on the button). */
  lockedReason: string | null;
}

export function choiceState(mission: Mission, choice: Choice): ChoiceState {
  const { flags, candles, lockedChoices } = useMissionStore.getState();
  if (choice.hiddenIfFlag && flags.includes(choice.hiddenIfFlag)) return { hidden: true, lockedReason: null };
  if ((lockedChoices[mission.id] ?? []).includes(choice.id)) return { hidden: true, lockedReason: null };
  if (choice.needsCandles && candles < choice.needsCandles) {
    return { hidden: false, lockedReason: `Needs ${choice.needsCandles} oxygen candles (${candles} left)` };
  }
  return { hidden: false, lockedReason: null };
}

/**
 * Chance of success (in %) for this crew, or null when the job can't fail.
 * Specialists help; tired people, missing people and bad air (conditions) make it harder.
 */
export function successChance(choice: Choice, slots: CrewSlot[], day: number): number | null {
  const canFail = choice.successRate !== undefined && (choice.failEffects !== undefined || choice.onFail !== undefined || choice.retryOnFail);
  if (!canFail) return null;
  const need = crewNeed(choice);
  const { duty, mission } = stores();
  let chance = choice.successRate ?? 100;
  if (need.best && slots.some((s) => need.best!.includes(s))) chance += SPECIALIST_BONUS;
  if (mission.flags.includes('spare-parts') && need.best?.includes('engineer')) chance += SPARE_PARTS_BONUS;
  for (const s of slots) {
    const f = duty.crew[s].fatigue;
    if (f >= FATIGUE_VERY_TIRED) chance -= VERY_TIRED_PENALTY;
    else if (f >= FATIGUE_TIRED) chance -= TIRED_PENALTY;
  }
  const missing = Math.max(0, need.min - slots.length);
  chance -= missing * MISSING_PENALTY;
  for (const c of activeConditions(day)) chance -= c.successPenalty ?? 0;
  return clamp(Math.round(chance), 5, 98);
}

// ───────────────────────── Days and events ─────────────────────────

function activeConditions(day: number): ActiveCondition[] {
  return useMissionStore.getState().conditions.filter((c) => c.untilDay === undefined || c.untilDay >= day);
}

/** The next day (from `fromDay` on) that has something to do: problems waiting, a fixed mission or a follow-up. */
export function nextEventDay(fromDay: number): number | null {
  const { openEvents, scheduled, completedMissions } = useMissionStore.getState();
  if (openEvents.length > 0) return fromDay;
  const days = [
    ...MISSIONS.filter((m) => m.day !== undefined && !m.followUpOnly && !completedMissions.includes(m.id)).map((m) => m.day!),
    ...scheduled.map((s) => Math.max(s.day, fromDay)),
  ].filter((d) => d >= fromDay && d <= MISSION_LAST_DAY);
  return days.length ? Math.min(...days) : null;
}

/** Applies a list of effects and returns what really changed (for the result screen). */
function applyAndMeasure(effects: ChoiceEffect[]): Partial<Record<ResourceKey, number>> {
  const before = { ...useResourceStore.getState() };
  applyEffects(useResourceStore.getState(), effects);
  const after = useResourceStore.getState();
  const diff: Partial<Record<ResourceKey, number>> = {};
  for (const e of effects) {
    const d = after[e.resource] - before[e.resource];
    if (Math.abs(d) >= 0.05) diff[e.resource] = d;
  }
  return diff;
}

/**
 * One morning on the station: jobs that ended yesterday finish (and pay off), people who
 * did not work rest, exhausted people take a forced rest day, and lasting conditions
 * apply their daily change. Runs once per day (lastTickDay), also for skipped days.
 */
function dayTick(day: number): void {
  const duty = useDutyStore.getState();
  const crew = { ...duty.crew };
  const finished = new Map<string, { task: DutyTask; slots: CrewSlot[] }>();

  for (const slot of CREW_SLOTS) {
    const d: CrewDuty = { ...crew[slot] };
    const workedYesterday = !!d.task && d.task.startDay <= day - 1 && d.task.untilDay >= day - 1;
    if (d.task && d.task.untilDay < day) {
      const entry = finished.get(d.task.taskId) ?? { task: d.task, slots: [] };
      entry.slots.push(slot);
      finished.set(d.task.taskId, entry);
      d.task = null;
    }
    if (d.fatigue >= FATIGUE_EXHAUSTED) {
      // Too tired to work: a forced rest day (the rest itself brings them down to "tired").
      d.restUntilDay = Math.max(d.restUntilDay, day);
      d.fatigue = FATIGUE_TIRED;
    } else if (!workedYesterday) {
      // A day without work: one step more rested.
      d.fatigue = Math.max(0, d.fatigue - 1);
    }
    crew[slot] = d;
  }
  useDutyStore.getState().setAll(crew);

  // Multi-day jobs that ended normally pay off now (e.g. the recycler repair is done).
  for (const { task, slots } of finished.values()) {
    const choice = getMission(task.missionId)?.choices.find((c) => c.id === task.choiceId);
    if (choice?.onDone && task.untilDay > task.startDay) applyOutcome(choice.onDone, slots, day);
  }

  const { conditions } = useMissionStore.getState();
  for (const c of conditions) {
    if (c.startDay < day && (c.untilDay === undefined || c.untilDay >= day)) applyEffects(useResourceStore.getState(), c.daily);
  }
  useMissionStore.setState({
    conditions: useMissionStore.getState().conditions.filter((c) => c.untilDay === undefined || c.untilDay >= day),
  });
  useDutyStore.setState({ lastTickDay: day });
}

/** Runs every morning from the last one done up to `toDay` (skipped days count too). */
export function advanceTo(toDay: number): void {
  const last = useDutyStore.getState().lastTickDay;
  for (let d = last + 1; d <= toDay; d++) dayTick(d);
}

/** Opens today's problems: follow-ups that are due, fixed missions of the day, and ones left from before. */
export function openDay(day: number): string[] {
  const { scheduled, openEvents, completedMissions, flags } = useMissionStore.getState();
  const due = scheduled.filter((s) => s.day <= day);
  const keep = scheduled.filter((s) => s.day > day);
  const open = [...openEvents];
  const add = (id: string) => {
    if (!open.includes(id) && !completedMissions.includes(id) && getMission(id)) open.push(id);
  };
  for (const s of due) if (!s.unlessFlag || !flags.includes(s.unlessFlag)) add(s.missionId);
  for (const m of MISSIONS) if (m.day === day && !m.followUpOnly) add(m.id);
  const r = useResourceStore.getState();
  useMissionStore.setState({
    openEvents: open,
    scheduled: keep,
    lockedChoices: {},
    dayStart: {
      food: r.food,
      water: r.water,
      energy: r.energy,
      oxygen: r.oxygen,
      health: r.health,
      satisfaction: r.satisfaction,
      radiation: r.radiation,
    },
  });
  return open;
}

/** Sets off chained missions. afterDays 0 = a new emergency right now (returns its id). */
function schedule(followUps: FollowUp[], day: number): string[] {
  const startedNow: string[] = [];
  for (const f of followUps) {
    if (f.chance !== undefined && !rollSuccess(f.chance)) continue;
    const mission = getMission(f.missionId);
    if (!mission) continue;
    const spread = f.afterDaysMax !== undefined ? Math.floor(seededRandom() * (f.afterDaysMax - f.afterDays + 1)) : 0;
    const when = day + f.afterDays + spread;
    const state = useMissionStore.getState();
    if (state.completedMissions.includes(f.missionId) || state.openEvents.includes(f.missionId)) continue;
    if (state.scheduled.some((s) => s.missionId === f.missionId)) continue;
    if (when <= day) {
      useMissionStore.setState({ openEvents: [...state.openEvents, f.missionId] });
      startedNow.push(f.missionId);
    } else if (when <= MISSION_LAST_DAY) {
      useMissionStore.setState({ scheduled: [...state.scheduled, { missionId: f.missionId, day: when, unlessFlag: f.unlessFlag }] });
    }
  }
  return startedNow;
}

/** Everything a choice does besides resources: conditions, flags, candles, follow-ups, personal health and rest. */
function applyOutcome(outcome: Outcome, slots: CrewSlot[], day: number): string[] {
  const state = useMissionStore.getState();
  let conditions = state.conditions;
  if (outcome.clearConditions?.length) conditions = conditions.filter((c) => !outcome.clearConditions!.includes(c.id));
  for (const c of outcome.addConditions ?? []) {
    conditions = [
      ...conditions.filter((x) => x.id !== c.id),
      { ...c, startDay: day, untilDay: c.days !== undefined ? day + c.days : undefined },
    ];
  }
  let flags = state.flags.filter((f) => !(outcome.clearFlags ?? []).includes(f));
  for (const f of outcome.setFlags ?? []) if (!flags.includes(f)) flags = [...flags, f];
  useMissionStore.setState({
    conditions,
    flags,
    candles: Math.max(0, state.candles + (outcome.candles ?? 0)),
  });

  const crewStore = useCrewStore.getState();
  for (const s of slots) {
    if (outcome.crewHealth) {
      if (s === 'commander') applyEffects(useResourceStore.getState(), [{ resource: 'health', delta: outcome.crewHealth / 4 }]);
      else crewStore.updateCrew(s, { health: clamp(crewStore.crew[s].health + outcome.crewHealth, 0, 100) });
    }
    const duty = useDutyStore.getState().crew[s];
    useDutyStore.getState().setDuty(s, {
      fatigue: clamp(duty.fatigue + (outcome.crewFatigue ?? 0), 0, FATIGUE_EXHAUSTED),
      restUntilDay: outcome.crewRestDays ? Math.max(duty.restUntilDay, day + outcome.crewRestDays) : duty.restUntilDay,
    });
  }
  return schedule(outcome.followUps ?? [], day);
}

// ───────────────────────── Sending the crew ─────────────────────────

export interface MissionResult {
  success: boolean;
  /** The mission comes back at once without the failed choice. */
  retry: boolean;
  narrative: string;
  changes: Partial<Record<ResourceKey, number>>;
  /** Extra lines: temporary fix, jobs stopped, who is busy, new emergencies. */
  notes: string[];
  /** Missions that started right now because of this choice. */
  newEmergencies: string[];
}

export function crewName(slot: CrewSlot, commanderName: string): string {
  if (slot === 'commander') return commanderName || 'Commander';
  return useCrewStore.getState().crew[slot].name.replace('Dr. ', '').split(' ')[0];
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? 'The crew';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** Stops the jobs of these people. Returns notes and missions to resume tomorrow. */
function interruptJobs(slots: CrewSlot[], day: number, commanderName: string): string[] {
  const notes: string[] = [];
  const duty = useDutyStore.getState().crew;
  const stopped = new Set<string>();
  for (const s of slots) {
    const d = duty[s];
    if (!d.task || availability(d, day) !== 'busy' || stopped.has(d.task.taskId)) continue;
    const task = d.task;
    stopped.add(task.taskId);
    // The whole job stops: everyone on it is free again.
    for (const other of CREW_SLOTS) {
      if (useDutyStore.getState().crew[other].task?.taskId === task.taskId) useDutyStore.getState().setDuty(other, { task: null });
    }
    const choice = getMission(task.missionId)?.choices.find((c) => c.id === task.choiceId);
    const stop = choice?.onInterrupt;
    if (stop) {
      applyEffects(useResourceStore.getState(), stop.effects);
      if (stop.resumeMissionId) schedule([{ missionId: stop.resumeMissionId, afterDays: 1 }], day);
    }
    notes.push(`${crewName(s, commanderName)} stopped "${task.label}". ${stop?.text ?? 'The job was left unfinished.'}`);
  }
  return notes;
}

/**
 * Sends the crew on a choice: stops the jobs of anyone pulled off a task, rolls the chance,
 * changes the resources, applies the outcome, keeps the crew busy and records the decision.
 */
export function sendCrew(mission: Mission, choice: Choice, slots: CrewSlot[], day: number, commanderName: string): MissionResult {
  const notes = interruptJobs(slots, day, commanderName);

  const chance = successChance(choice, slots, day);
  const success = chance === null ? true : rollSuccess(chance);
  const effects = success ? choice.effects : (choice.failEffects ?? choice.effects);
  const changes = applyAndMeasure(effects);

  const outcome = success ? choice.onSuccess : choice.onFail;
  const newEmergencies = outcome ? applyOutcome(outcome, slots, day) : [];

  // The crew is busy until the job ends and gets more tired.
  const untilDay = day + (choice.busyDays ?? 0);
  const taskId = `${mission.id}:${choice.id}:${day}`;
  const crewStore = useCrewStore.getState();
  for (const s of slots) {
    const d = useDutyStore.getState().crew[s];
    const fatigue = clamp(d.fatigue + (choice.fatigue ?? 1), 0, FATIGUE_EXHAUSTED);
    useDutyStore.getState().setDuty(s, {
      fatigue,
      task: { taskId, missionId: mission.id, choiceId: choice.id, label: mission.title, room: mission.room, startDay: day, untilDay },
    });
    // Overwork costs morale (personal) and a little station satisfaction.
    if (fatigue >= FATIGUE_VERY_TIRED) {
      if (s !== 'commander') crewStore.updateCrew(s, { morale: clamp(crewStore.crew[s].morale - 3, 0, 100) });
      applyEffects(useResourceStore.getState(), [{ resource: 'satisfaction', delta: -1 }]);
    }
  }

  const names = slots.map((s) => crewName(s, commanderName));
  const narrative = (success ? choice.narrative : (choice.failNarrative ?? choice.narrative)).split('{crew}').join(joinNames(names));

  if (choice.temporary && success) notes.push('Temporary fix: it works for now, but it may cause trouble later.');
  if ((choice.busyDays ?? 0) > 0) notes.push(`${joinNames(names)} will be busy until Day ${untilDay}.`);
  for (const s of slots) {
    const d = useDutyStore.getState().crew[s];
    if (d.restUntilDay > day) notes.push(`${crewName(s, commanderName)} must rest until Day ${d.restUntilDay}.`);
    else if (d.fatigue >= FATIGUE_VERY_TIRED) notes.push(`${crewName(s, commanderName)} is very tired and needs rest.`);
  }
  for (const id of newEmergencies) notes.push(`NEW PROBLEM: ${getMission(id)?.title ?? id}!`);

  const state = useMissionStore.getState();
  useMissionStore.setState({ decisions: [...state.decisions, { missionId: mission.id, choiceId: choice.id, day, success }] });

  const retry = !success && !!choice.retryOnFail;
  if (retry) {
    const locked = state.lockedChoices[mission.id] ?? [];
    useMissionStore.setState({ lockedChoices: { ...state.lockedChoices, [mission.id]: [...locked, choice.id] } });
  } else {
    // Done: off today's list. The window stays open (currentMission) until the player closes it.
    const now = useMissionStore.getState();
    useMissionStore.setState({
      completedMissions: now.completedMissions.includes(mission.id) ? now.completedMissions : [...now.completedMissions, mission.id],
      openEvents: now.openEvents.filter((id) => id !== mission.id),
    });
  }

  return { success, retry, narrative, changes, notes, newEmergencies };
}

/** "Deal with it tomorrow": pays the cost of waiting and moves the problem to the next day. */
export function deferMission(mission: Mission, day: number): Partial<Record<ResourceKey, number>> {
  const changes = mission.defer ? applyAndMeasure(mission.defer.effects) : {};
  const state = useMissionStore.getState();
  useMissionStore.setState({
    openEvents: state.openEvents.filter((id) => id !== mission.id),
    scheduled: [...state.scheduled, { missionId: mission.id, day: day + 1 }],
  });
  return changes;
}

/** Who goes outside for "crewOutside" missions: the first one free, engineer first. */
export function pickOutsideCrew(day: number): CrewSlot {
  const duty = useDutyStore.getState().crew;
  const order: CrewSlot[] = ['engineer', 'scientist', 'commander', 'medic'];
  return order.find((s) => availability(duty[s], day) === 'free') ?? 'engineer';
}

// ───────────────────────── Checks (run by validateMissions) ─────────────────────────

/** Problems in mission data: broken follow-up links, rooms without a "!" spot, choices with no crew. */
export function validateMissions(validRooms: readonly string[]): string[] {
  const errors: string[] = [];
  const ids = new Set(MISSIONS.map((m) => m.id));
  if (ids.size !== MISSIONS.length) errors.push('Two missions share the same id.');
  for (const m of MISSIONS) {
    if (!validRooms.includes(m.room) || m.room === 'corridor') errors.push(`${m.id}: room "${m.room}" has no "!" spot.`);
    for (const c of m.choices) {
      const need = crewNeed(c);
      if (need.min < 1 && !m.crewOutside) errors.push(`${m.id}/${c.id}: needs at least one crew member.`);
      const outcomes = [c.onSuccess, c.onFail, c.onDone].filter(Boolean) as Outcome[];
      for (const o of outcomes) {
        for (const f of o.followUps ?? []) {
          if (!ids.has(f.missionId)) errors.push(`${m.id}/${c.id}: follow-up "${f.missionId}" does not exist.`);
          const target = getMission(f.missionId);
          if (target?.followUpOnly && f.missionId === m.id) errors.push(`${m.id}/${c.id}: a follow-up schedules itself (loop).`);
        }
      }
      const resume = c.onInterrupt?.resumeMissionId;
      if (resume && !ids.has(resume)) errors.push(`${m.id}/${c.id}: resume mission "${resume}" does not exist.`);
    }
  }
  return errors;
}
