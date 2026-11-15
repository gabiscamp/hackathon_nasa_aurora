import { useResourceStore, RESOURCE_KEYS, type Resources } from '../stores/useResourceStore';
import { useMissionStore } from '../stores/useMissionStore';
import { useDutyStore } from '../stores/useDutyStore';
import { useCrewStore } from '../stores/useCrewStore';
import { useGameStore } from '../stores/useGameStore';

/**
 * "Try again from Day X" after a game over: a copy of the whole mission at the start of each act
 * (Day 1, 16, 31). Kept in memory, like the game day itself.
 */
interface Checkpoint {
  act: 1 | 2 | 3;
  day: number;
  resources: Resources;
  mission: Partial<ReturnType<typeof useMissionStore.getState>>;
  duty: Pick<ReturnType<typeof useDutyStore.getState>, 'crew' | 'lastTickDay'>;
  crew: Pick<ReturnType<typeof useCrewStore.getState>, 'teamId' | 'crew'>;
}

let checkpoint: Checkpoint | null = null;

/** Only the data of a store (no functions), deep-copied. */
function dataOf<T extends object>(state: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(state)) if (typeof v !== 'function') (out as Record<string, unknown>)[k] = v;
  return structuredClone(out);
}

/** Saves the mission as it is now, if this act has no checkpoint yet. */
export function saveCheckpoint(act: 1 | 2 | 3, day: number): void {
  if (checkpoint && checkpoint.act >= act) return;
  const r = useResourceStore.getState();
  const resources = {} as Resources;
  for (const k of RESOURCE_KEYS) resources[k] = r[k];
  const duty = useDutyStore.getState();
  const crew = useCrewStore.getState();
  checkpoint = {
    act,
    day,
    resources,
    mission: dataOf({ ...useMissionStore.getState(), currentMission: null }),
    duty: structuredClone({ crew: duty.crew, lastTickDay: duty.lastTickDay }),
    crew: structuredClone({ teamId: crew.teamId, crew: crew.crew }),
  };
}

/** The day "Try again" goes back to (null = no checkpoint). */
export function checkpointDay(): number | null {
  return checkpoint?.day ?? null;
}

/** Puts the mission back as it was at the checkpoint (the morning briefing of that day). */
export function restoreCheckpoint(): boolean {
  if (!checkpoint) return false;
  const cp = structuredClone(checkpoint);
  useResourceStore.setState(cp.resources);
  useMissionStore.setState({ ...cp.mission, currentMission: null, collapse: null });
  useDutyStore.setState(cp.duty);
  useCrewStore.setState(cp.crew);
  useGameStore.setState({ day: cp.day, phase: 'briefing', scene: 'game', resumeScene: null });
  return true;
}

export function clearCheckpoint(): void {
  checkpoint = null;
}
