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
  type SideRisk,
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
  type Illness,
} from '../stores/useDutyStore';
import { useResourceStore, type ResourceKey } from '../stores/useResourceStore';
import { useCrewStore } from '../stores/useCrewStore';
import { useGameStore } from '../stores/useGameStore';
import { applyEffects } from './resourceEngine';
import { rollSuccess, seededRandom } from '../utils/random';
import { clamp } from '../utils/clamp';
import { MISSION_DAYS } from '../data/missionLength';

/**
 * Mission engine: crew assignment, multi-day jobs, tiredness, sickness, station conditions and
 * chained consequences. Extends the original one-mission-per-day system (eventResolver)
 * instead of replacing it: missions without the new fields still work, with DEFAULT_CREW_NEED.
 */

/** A specialist on the job (the "Best:" role). */
export const SPECIALIST_BONUS = 15;
/** Spare parts saved from the Cargo Bay make engineering repairs easier. */
export const SPARE_PARTS_BONUS = 10;
/** Extra food for spacewalkers (problem 6): +10% on spacewalks. */
export const EVA_FOOD_BONUS = 10;
/** Condition id set by that choice. */
export const EVA_FOOD_CONDITION = 'portions-eva';
/** Per tired / very tired person on a risky job. */
export const TIRED_PENALTY = 10;
export const VERY_TIRED_PENALTY = 15;
/** Per missing person when a job is tried with fewer people. */
export const MISSING_PENALTY = 20;

const MISSION_LAST_DAY = MISSION_DAYS;

/** Mission ids of the sickness problems (missoes.txt problems 1 and 2). */
export const SICK_MISSION = 'crew-sick';
export const VERY_SICK_MISSION = 'crew-very-sick';

// Sickness rules from missoes.txt (problems 1 and 2). Index = day of the treatment (1st, 2nd…).
const RECOVERY: Record<'rest' | 'isolation' | 'working', number[]> = {
  rest: [45, 70, 90, 100],
  isolation: [25, 50, 70, 90, 100],
  working: [10, 20, 40, 60, 80, 100],
};
/** Others overwork while someone rests: satisfaction loss on day 1, 2, 3, 4+. */
const REST_OVERLOAD = [1, 2, 3, 5];
/** Chance (%) to get worse each day ("vira o problema 2"). */
const WORSEN: Record<'rest' | 'isolation' | 'working', number> = { rest: 1, isolation: 3.5, working: 15 };
/** Days a terribly sick crew member needs with the medic caring (or being the patient), and without. */
const SEVERE_DAYS_MEDIC = 3;
const SEVERE_DAYS_OTHER = 5;
/** Station health below this: someone may get sick (problems 6, 11…: "Se a Saúde ficar abaixo de 30"). */
export const SICK_HEALTH = 30;
const LOW_HEALTH_SICK_CHANCE = 30;

export function crewNeed(choice: Choice): CrewNeed {
  return choice.crew ?? DEFAULT_CREW_NEED;
}

function stores() {
  return { mission: useMissionStore.getState(), duty: useDutyStore.getState() };
}

function currentDay(): number {
  return useGameStore.getState().day;
}

export function crewName(slot: CrewSlot, commanderName?: string): string {
  if (slot === 'commander') return commanderName || useGameStore.getState().playerName.split(' ')[0] || 'Commander';
  return useCrewStore.getState().crew[slot].name.replace('Dr. ', '').split(' ')[0];
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? 'The crew';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** The sick crew member of a patient mission, if any. */
export function patientOf(missionId: string): CrewSlot | undefined {
  return useMissionStore.getState().patients[missionId];
}

/** Replaces {patient} with the sick crew member's name. */
export function fillPatient(text: string, missionId: string): string {
  const p = patientOf(missionId);
  const name = p ? crewName(p) : 'A crew member';
  return text.split('{patient}').join(name).split('{honoree}').join(name);
}

// ───────────────────────── Choices ─────────────────────────

export interface ChoiceState {
  hidden: boolean;
  /** Why it can't be picked right now (shown on the button). */
  lockedReason: string | null;
}

/** Can this person be sent on a job today? (Busy people can be pulled off; resting or sick people can't.) */
function canBeSent(slot: CrewSlot, day: number): boolean {
  const a = availability(useDutyStore.getState().crew[slot], day);
  return a === 'free' || a === 'busy';
}

export function choiceState(mission: Mission, choice: Choice, day: number = currentDay()): ChoiceState {
  const { flags, candles, lockedChoices } = useMissionStore.getState();
  if (choice.hiddenIfFlag && flags.includes(choice.hiddenIfFlag)) return { hidden: true, lockedReason: null };
  if (choice.requiresFlag && !flags.includes(choice.requiresFlag)) return { hidden: true, lockedReason: null };
  if (choice.hiddenIfCondition && activeConditions(day).some((c) => c.id === choice.hiddenIfCondition)) return { hidden: true, lockedReason: null };
  if (choice.maxUses && (useMissionStore.getState().counters[choice.maxUses.counter] ?? 0) >= choice.maxUses.max) {
    return { hidden: false, lockedReason: 'None left' };
  }
  if ((lockedChoices[mission.id] ?? []).includes(choice.id)) return { hidden: true, lockedReason: null };
  const only = crewNeed(choice).only;
  // "Se o médico estiver cuidando de alguém, essa escolha some": an only-specialist who is sick,
  // resting, or caring for someone (or is the patient) makes the choice disappear.
  if (only) {
    const patient = patientOf(mission.id);
    const usable = only.filter((s) => s !== patient && canBeSent(s, day) && !isCaretaker(s));
    if (usable.length === 0) return { hidden: true, lockedReason: null };
  }
  if (choice.needsCandles && candles < choice.needsCandles) {
    return { hidden: false, lockedReason: `Needs ${choice.needsCandles} oxygen candles (${candles} left)` };
  }
  return { hidden: false, lockedReason: null };
}

function isCaretaker(slot: CrewSlot): boolean {
  const crew = useDutyStore.getState().crew;
  return CREW_SLOTS.some((s) => crew[s].illness?.caretaker === slot);
}

/**
 * Chance of success (in %) for this crew, or null when the job can't fail (or is plain luck).
 * Specialists help; tired people, missing people and bad air (conditions) make it harder.
 */
export function successChance(choice: Choice, slots: CrewSlot[], day: number): number | null {
  const canFail = choice.successRate !== undefined && (choice.failEffects !== undefined || choice.onFail !== undefined || choice.retryOnFail);
  if (!canFail || choice.noVerdict) return null;
  const need = crewNeed(choice);
  const { duty, mission } = stores();
  let chance = choice.successRate ?? 100;
  if (need.best && slots.some((s) => need.best!.includes(s))) chance += SPECIALIST_BONUS;
  if (mission.flags.includes('spare-parts') && need.best?.includes('engineer')) chance += SPARE_PARTS_BONUS;
  if (choice.spacewalk && activeConditions(day).some((c) => c.id === EVA_FOOD_CONDITION)) chance += EVA_FOOD_BONUS;
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
  return useMissionStore
    .getState()
    .conditions.filter((c) => c.startDay <= day && (c.untilDay === undefined || c.untilDay >= day));
}

/** Missions that can't happen again once solved (repeatable ones can). */
function isClosed(missionId: string): boolean {
  const m = getMission(missionId);
  return !!m && !m.repeatable && !m.repeatEveryDays && useMissionStore.getState().completedMissions.includes(missionId);
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
    if (Math.abs(d) >= 0.05) diff[e.resource] = (diff[e.resource] ?? 0) + d;
  }
  return diff;
}

function addNews(text: string): void {
  useMissionStore.setState({ news: [...useMissionStore.getState().news, text] });
}

function setIllness(slot: CrewSlot, illness: Illness | null): void {
  useDutyStore.getState().setDuty(slot, { illness });
}

/** Ends a caretaker's job (the patient got better or the care stopped). */
function freeCaretaker(caretaker: CrewSlot | undefined): void {
  if (!caretaker) return;
  const d = useDutyStore.getState().crew[caretaker];
  if (d.task?.missionId === SICK_MISSION || d.task?.missionId === VERY_SICK_MISSION) useDutyStore.getState().setDuty(caretaker, { task: null });
}

/** Someone healthy who is not already sick (for a new sickness). */
function pickHealthy(exclude: CrewSlot[] = []): CrewSlot | undefined {
  const crew = useDutyStore.getState().crew;
  const options = CREW_SLOTS.filter((s) => !crew[s].illness && !exclude.includes(s));
  if (options.length === 0) return undefined;
  return options[Math.floor(seededRandom() * options.length)];
}

/** Someone gets sick: opens problem 1 for them today (if no one else is waiting for a decision). */
function startSickness(patient: CrewSlot, day: number, why: string): void {
  const st = useMissionStore.getState();
  if (st.openEvents.includes(SICK_MISSION) || st.scheduled.some((s) => s.missionId === SICK_MISSION)) return;
  setIllness(patient, { mode: 'pending', sinceDay: day });
  useMissionStore.setState({ scheduled: [...st.scheduled, { missionId: SICK_MISSION, day, patient }] });
  addNews(`${crewName(patient)} ${why}`);
}

/** Problems 1 and 2, one morning: recover, get worse, infect someone, or tire out the others. */
function sicknessTick(day: number): void {
  for (const slot of CREW_SLOTS) {
    const ill = useDutyStore.getState().crew[slot].illness;
    if (!ill || ill.mode === 'pending' || ill.sinceDay >= day) continue;
    const n = day - ill.sinceDay; // 1 = first morning of the treatment
    const name = crewName(slot);

    if (ill.mode === 'severe') {
      applyEffects(useResourceStore.getState(), [
        { resource: 'food', delta: -1 },
        { resource: 'water', delta: -1 },
        { resource: 'oxygen', delta: -1 },
      ]);
      if (ill.untilDay !== undefined && day >= ill.untilDay) {
        freeCaretaker(ill.caretaker);
        setIllness(slot, null);
        addNews(`${name} is finally well again after being very sick!`);
      }
      continue;
    }

    const medicHelps = slot === 'medic' || ill.caretaker === 'medic';
    const table = RECOVERY[ill.mode];
    const recover = Math.min(100, table[Math.min(n - 1, table.length - 1)] * (medicHelps ? 2 : 1));
    if (rollSuccess(recover)) {
      freeCaretaker(ill.caretaker);
      setIllness(slot, null);
      addNews(`${name} feels better and is back to work!`);
      continue;
    }
    if (rollSuccess(WORSEN[ill.mode])) {
      freeCaretaker(ill.caretaker);
      setIllness(slot, { mode: 'pending', sinceDay: day });
      const st = useMissionStore.getState();
      useMissionStore.setState({ scheduled: [...st.scheduled, { missionId: VERY_SICK_MISSION, day, patient: slot }] });
      addNews(`${name} got much worse and needs constant care!`);
      continue;
    }
    if (ill.mode === 'rest') {
      applyEffects(useResourceStore.getState(), [
        { resource: 'satisfaction', delta: -REST_OVERLOAD[Math.min(n - 1, REST_OVERLOAD.length - 1)] },
      ]);
    }
    const spread = ill.mode === 'rest' ? Math.min(20, 7 + 3 * (n - 1)) : ill.mode === 'working' ? Math.min(45, 15 + 10 * (n - 1)) : 0;
    if (spread > 0 && rollSuccess(spread)) {
      const next = pickHealthy([slot]);
      if (next) startSickness(next, day, `caught the bug from ${name}.`);
    }
  }
}

/**
 * One morning on the station: jobs that ended yesterday finish (and pay off), people who
 * did not work rest, exhausted people take a forced rest day, sick people get better or worse,
 * and lasting conditions apply their daily change. Runs once per day (lastTickDay), skipped days too.
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
    if (choice?.onDone && task.untilDay > task.startDay) applyOutcome(choice.onDone, slots, day, task.missionId);
  }

  sicknessTick(day);

  const { conditions } = useMissionStore.getState();
  for (const c of conditions) {
    if (c.startDay < day && (c.untilDay === undefined || c.untilDay >= day)) {
      applyEffects(useResourceStore.getState(), c.daily);
      // Some lasting problems can make someone sick, more likely each day (e.g. no vitamins).
      if (c.sickChance?.length) {
        const chance = c.sickChance[Math.min(day - c.startDay - 1, c.sickChance.length - 1)];
        const who = pickHealthy();
        if (who && rollSuccess(chance)) startSickness(who, day, `got sick (${c.label.toLowerCase()}).`);
      }
    }
  }

  // Effects that were waiting for today (a harvest, a surprise in the pantry…).
  const pending = useMissionStore.getState().pendingEffects;
  const flagsNow = useMissionStore.getState().flags;
  for (const p of pending.filter((x) => x.day <= day)) {
    if (p.unlessFlag && flagsNow.includes(p.unlessFlag)) continue;
    applyEffects(useResourceStore.getState(), p.effects);
    addNews(p.text);
  }
  useMissionStore.setState({ pendingEffects: pending.filter((x) => x.day > day) });

  // Missions that start by themselves when a bar crosses a line (e.g. food below 20).
  const res = useResourceStore.getState();
  for (const m of MISSIONS) {
    const t = m.trigger;
    if (!t || isClosed(m.id) || day < (t.fromDay ?? 1)) continue;
    const st = useMissionStore.getState();
    if (st.openEvents.includes(m.id) || st.scheduled.some((x) => x.missionId === m.id)) continue;
    const v = res[t.resource];
    const crossed = (t.below !== undefined && v < t.below) || (t.above !== undefined && v > t.above);
    if (crossed && rollSuccess(t.chance ?? 100)) {
      useMissionStore.setState({ scheduled: [...st.scheduled, { missionId: m.id, day }] });
    }
  }
  useMissionStore.setState({
    conditions: useMissionStore.getState().conditions.filter((c) => c.untilDay === undefined || c.untilDay >= day),
  });

  // Poor health makes people sick (missoes.txt: "Se a Saúde ficar abaixo de 30, vira o problema 1").
  const anyoneSick = CREW_SLOTS.some((s) => useDutyStore.getState().crew[s].illness);
  if (useResourceStore.getState().health < SICK_HEALTH && !anyoneSick && rollSuccess(LOW_HEALTH_SICK_CHANCE)) {
    const who = pickHealthy();
    if (who) startSickness(who, day, 'got sick: the crew has been weak for too long.');
  }
  useDutyStore.setState({ lastTickDay: day });
}

/** Runs every morning from the last one done up to `toDay` (skipped days count too). */
export function advanceTo(toDay: number): void {
  const last = useDutyStore.getState().lastTickDay;
  if (toDay > last) useMissionStore.setState({ news: [] });
  for (let d = last + 1; d <= toDay; d++) dayTick(d);
}

/** Gives a patient mission its sick crew member (the one set off, or someone healthy). */
function assignPatient(missionId: string, day: number, preferred?: CrewSlot): void {
  const m = getMission(missionId);
  if (!m?.patient && !m?.honoree) return;
  const patients = useMissionStore.getState().patients;
  const patient = preferred ?? patients[missionId] ?? pickHealthy();
  if (!patient) return;
  const ill = useDutyStore.getState().crew[patient].illness;
  if (m.patient && !ill) setIllness(patient, { mode: 'pending', sinceDay: day });
  useMissionStore.setState({ patients: { ...useMissionStore.getState().patients, [missionId]: patient } });
}

/** Opens today's problems: follow-ups that are due, fixed missions of the day, and ones left from before. */
export function openDay(day: number): string[] {
  const { scheduled, openEvents, flags } = useMissionStore.getState();
  const due = scheduled.filter((s) => s.day <= day);
  const keep = scheduled.filter((s) => s.day > day);
  const open = [...openEvents];
  const add = (id: string, patient?: CrewSlot) => {
    if (open.includes(id) || isClosed(id) || !getMission(id)) return;
    open.push(id);
    assignPatient(id, day, patient);
  };
  for (const s of due) if (!s.unlessFlag || !flags.includes(s.unlessFlag)) add(s.missionId, s.patient);
  for (const m of MISSIONS) {
    if (m.day !== day || m.followUpOnly || useMissionStore.getState().completedMissions.includes(m.id)) continue;
    if (m.skipIfFlag && flags.includes(m.skipIfFlag)) {
      // It will never happen (e.g. the plants died): close it so it is not waited for.
      useMissionStore.setState({ completedMissions: [...useMissionStore.getState().completedMissions, m.id] });
      continue;
    }
    if (m.delayIfFlag && flags.includes(m.delayIfFlag.flag) && !keep.some((k) => k.missionId === m.id)) {
      keep.push({ missionId: m.id, day: day + m.delayIfFlag.days });
      continue;
    }
    add(m.id);
  }
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
function schedule(followUps: FollowUp[], day: number, fromMissionId?: string): string[] {
  const startedNow: string[] = [];
  for (const f of followUps) {
    if (f.requiresCounter && (useMissionStore.getState().counters[f.requiresCounter.id] ?? 0) < f.requiresCounter.atLeast) continue;
    if (f.chance !== undefined && !rollSuccess(f.chance)) continue;
    const mission = getMission(f.missionId);
    if (!mission) continue;
    const spread = f.afterDaysMax !== undefined ? Math.floor(seededRandom() * (f.afterDaysMax - f.afterDays + 1)) : 0;
    const when = day + f.afterDays + spread;
    const state = useMissionStore.getState();
    if (isClosed(f.missionId) || state.openEvents.includes(f.missionId)) continue;
    if (state.scheduled.some((s) => s.missionId === f.missionId)) continue;
    const patient = f.samePatient && fromMissionId ? patientOf(fromMissionId) : undefined;
    if (when <= day) {
      useMissionStore.setState({ openEvents: [...state.openEvents, f.missionId] });
      assignPatient(f.missionId, day, patient);
      startedNow.push(f.missionId);
    } else if (when <= MISSION_LAST_DAY) {
      useMissionStore.setState({
        scheduled: [...state.scheduled, { missionId: f.missionId, day: when, unlessFlag: f.unlessFlag, patient }],
      });
    }
  }
  return startedNow;
}

/** Everything a choice does besides resources: conditions, flags, candles, counters, follow-ups, personal health and rest. */
function applyOutcome(outcome: Outcome, slots: CrewSlot[], day: number, missionId?: string): string[] {
  const state = useMissionStore.getState();
  let conditions = state.conditions;
  if (outcome.clearConditions?.length) conditions = conditions.filter((c) => !outcome.clearConditions!.includes(c.id));
  for (const c of outcome.addConditions ?? []) {
    conditions = [
      ...conditions.filter((x) => x.id !== c.id),
      {
        ...c,
        startDay: day + (c.startsInDays ?? 0),
        untilDay: c.days !== undefined ? day + (c.startsInDays ?? 0) + c.days : undefined,
      },
    ];
  }
  let flags = state.flags.filter((f) => !(outcome.clearFlags ?? []).includes(f));
  for (const f of outcome.setFlags ?? []) if (!flags.includes(f)) flags = [...flags, f];
  const counters = { ...state.counters };
  if (outcome.counter) counters[outcome.counter.id] = outcome.counter.reset ? 0 : (counters[outcome.counter.id] ?? 0) + (outcome.counter.add ?? 1);
  const pendingEffects = [
    ...state.pendingEffects,
    ...(outcome.delayed ?? []).map((d) => ({ day: day + d.afterDays, effects: d.effects, text: d.text, unlessFlag: d.unlessFlag })),
  ];
  useMissionStore.setState({
    conditions,
    flags,
    counters,
    pendingEffects,
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
  return schedule(outcome.followUps ?? [], day, missionId);
}

/** Starts the treatment chosen for the patient (problems 1 and 2). */
function applyIllness(mode: NonNullable<Outcome['illness']>, missionId: string, slots: CrewSlot[], day: number): string[] {
  const patient = patientOf(missionId);
  if (!patient) return [];
  const caretaker = mode === 'rest' || mode === 'severe' ? slots[0] : undefined;
  const notes: string[] = [];
  if (mode === 'severe') {
    const fast = caretaker === 'medic' || patient === 'medic';
    const untilDay = day + (fast ? SEVERE_DAYS_MEDIC : SEVERE_DAYS_OTHER);
    setIllness(patient, { mode, sinceDay: day, caretaker, untilDay });
    notes.push(`${crewName(patient)} should be well on Day ${untilDay}.`);
  } else {
    setIllness(patient, { mode, sinceDay: day, caretaker });
  }
  if (caretaker) {
    // The caretaker stays busy until the patient is better (the job ends in freeCaretaker).
    const d = useDutyStore.getState().crew[caretaker];
    useDutyStore.getState().setDuty(caretaker, {
      task: d.task ? { ...d.task, untilDay: MISSION_LAST_DAY, label: `Caring for ${crewName(patient)}` } : d.task,
    });
    notes.push(`${crewName(caretaker)} will care for ${crewName(patient)} until ${crewName(patient)} is better.`);
  }
  return notes;
}

// ───────────────────────── Sending the crew ─────────────────────────

export interface MissionResult {
  success: boolean;
  /** The mission comes back at once without the failed choice. */
  retry: boolean;
  /** Plain luck: no "It worked!" / "It did not work." */
  noVerdict: boolean;
  narrative: string;
  changes: Partial<Record<ResourceKey, number>>;
  /** Extra lines: temporary fix, jobs stopped, who is busy, new emergencies. */
  notes: string[];
  /** Missions that started right now because of this choice. */
  newEmergencies: string[];
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
    // Pulled away from a sick crew member: they are left alone.
    const patient = CREW_SLOTS.find((p) => useDutyStore.getState().crew[p].illness?.caretaker === s);
    if (patient) {
      const ill = useDutyStore.getState().crew[patient].illness!;
      if (ill.mode === 'severe') {
        setIllness(patient, { ...ill, caretaker: undefined, untilDay: (ill.untilDay ?? day) + 2 });
        notes.push(`${crewName(s, commanderName)} stopped caring for ${crewName(patient)}. Alone, ${crewName(patient)} will need 2 more days to get better.`);
      } else {
        setIllness(patient, { mode: 'isolation', sinceDay: day });
        notes.push(`${crewName(s, commanderName)} stopped caring for ${crewName(patient)}, who now rests alone (slower to get better).`);
      }
      continue;
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

/** The chance of a side risk right now (null = no risk). */
export function sideRiskChance(risk: SideRisk | undefined, day: number = currentDay()): number | null {
  if (!risk) return null;
  if (risk.unlessCondition && activeConditions(day).some((c) => c.id === risk.unlessCondition)) return null;
  if (risk.steps) {
    const n = useMissionStore.getState().counters[risk.steps.counter] ?? 0;
    return risk.steps.chances[Math.min(n, risk.steps.chances.length - 1)];
  }
  return risk.chance;
}

/**
 * Sends the crew on a choice: stops the jobs of anyone pulled off a task, rolls the chance,
 * changes the resources, applies the outcome, keeps the crew busy and records the decision.
 */
export function sendCrew(mission: Mission, choice: Choice, slots: CrewSlot[], day: number, commanderName: string): MissionResult {
  const notes = interruptJobs(slots, day, commanderName);

  // Plain luck (noVerdict) uses the written chance; skill jobs use the crew's chance.
  const chance = choice.noVerdict && choice.successRate !== undefined ? choice.successRate : successChance(choice, slots, day);
  const success = chance === null ? true : rollSuccess(chance);
  const need = crewNeed(choice);
  const specialist = !!need.best && slots.some((s) => need.best!.includes(s));
  const effects = [
    ...(success ? choice.effects : (choice.failEffects ?? choice.effects)),
    ...(success && specialist ? (choice.bestBonus ?? []) : []),
  ];
  const changes = applyAndMeasure(effects);

  // A second risk that does not depend on success (e.g. ripping food packets while moving them).
  const riskChance = sideRiskChance(choice.sideRisk, day);
  if (choice.sideRisk && riskChance !== null && rollSuccess(riskChance)) {
    const extra = applyAndMeasure(choice.sideRisk.effects);
    for (const [k, v] of Object.entries(extra) as [ResourceKey, number][]) changes[k] = (changes[k] ?? 0) + v;
    if (choice.sideRisk.setFlags?.length) {
      const f = useMissionStore.getState().flags;
      useMissionStore.setState({ flags: [...f, ...choice.sideRisk.setFlags.filter((x) => !f.includes(x))] });
    }
    notes.push(choice.sideRisk.text);
  }

  const outcome = success ? choice.onSuccess : choice.onFail;
  const newEmergencies = outcome ? applyOutcome(outcome, slots, day, mission.id) : [];

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

  if (outcome?.illness) notes.push(...applyIllness(outcome.illness, mission.id, slots, day));

  const names = slots.map((s) => crewName(s, commanderName));
  const raw = success ? choice.narrative : (choice.failNarrative ?? choice.narrative);
  const narrative = fillPatient(raw.split('{crew}').join(joinNames(names)), mission.id);

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
    finishMission(mission, day);
  }

  return { success, retry, noVerdict: !!choice.noVerdict, narrative, changes, notes, newEmergencies };
}

/** Off today's list. Weekly missions come back; others are done for good. The window stays open until closed. */
function finishMission(mission: Mission, day: number): void {
  const now = useMissionStore.getState();
  const patients = { ...now.patients };
  delete patients[mission.id];
  const repeats = mission.repeatEveryDays !== undefined || mission.repeatable;
  useMissionStore.setState({
    completedMissions: repeats || now.completedMissions.includes(mission.id) ? now.completedMissions : [...now.completedMissions, mission.id],
    openEvents: now.openEvents.filter((id) => id !== mission.id),
    patients,
  });
  if (mission.repeatEveryDays !== undefined) {
    const next = day + mission.repeatEveryDays;
    const st = useMissionStore.getState();
    if (next <= MISSION_LAST_DAY && !st.scheduled.some((s) => s.missionId === mission.id)) {
      useMissionStore.setState({ scheduled: [...st.scheduled, { missionId: mission.id, day: next }] });
    }
  }
}

/** "Deal with it tomorrow": pays the cost of waiting and moves the problem to the next day. */
export function deferMission(mission: Mission, day: number): Partial<Record<ResourceKey, number>> {
  const changes = mission.defer ? applyAndMeasure(mission.defer.effects) : {};
  const state = useMissionStore.getState();
  useMissionStore.setState({
    openEvents: state.openEvents.filter((id) => id !== mission.id),
    scheduled: [...state.scheduled, { missionId: mission.id, day: day + 1, patient: state.patients[mission.id] }],
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
  const fixedDays = new Map<number, string[]>();
  for (const m of MISSIONS) {
    if (!validRooms.includes(m.room) || m.room === 'corridor') errors.push(`${m.id}: room "${m.room}" has no "!" spot.`);
    if (m.day !== undefined && (m.day < 1 || m.day > MISSION_LAST_DAY)) errors.push(`${m.id}: day ${m.day} is outside the ${MISSION_LAST_DAY}-day mission.`);
    if (m.day !== undefined) fixedDays.set(m.day, [...(fixedDays.get(m.day) ?? []), m.id]);
    for (const c of m.choices) {
      const need = crewNeed(c);
      // Every job needs someone: the crew sent, the person outside, or the patient who keeps working.
      if (need.min < 1 && !m.crewOutside && !m.patient) errors.push(`${m.id}/${c.id}: needs at least one crew member.`);
      const outcomes = [c.onSuccess, c.onFail, c.onDone].filter(Boolean) as Outcome[];
      for (const o of outcomes) {
        if (o.illness && !m.patient) errors.push(`${m.id}/${c.id}: illness outcome on a mission without a patient.`);
        for (const f of o.followUps ?? []) {
          if (!ids.has(f.missionId)) errors.push(`${m.id}/${c.id}: follow-up "${f.missionId}" does not exist.`);
          if (f.missionId === m.id) errors.push(`${m.id}/${c.id}: a mission schedules itself (use repeatEveryDays).`);
        }
      }
      if (c.maxUses && !(c.onSuccess?.counter?.id === c.maxUses.counter)) errors.push(`${m.id}/${c.id}: maxUses without a counter in onSuccess.`);
      const resume = c.onInterrupt?.resumeMissionId;
      if (resume && !ids.has(resume)) errors.push(`${m.id}/${c.id}: resume mission "${resume}" does not exist.`);
    }
  }
  return errors;
}
