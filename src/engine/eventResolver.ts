import type { Mission, Choice } from '../data/missions';
import { rollSuccess } from '../utils/random';

export function pickMissionForDay(
  day: number,
  act: 1 | 2 | 3,
  completedMissions: string[],
  allMissions: Mission[],
): Mission | null {
  const fixed = allMissions.find(
    (m) => m.day === day && !completedMissions.includes(m.id),
  );
  if (fixed) return fixed;

  const pool = allMissions.filter(
    (m) => m.act === act && !m.day && !completedMissions.includes(m.id),
  );
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export interface ResolvedChoice {
  success: boolean;
  narrative: string;
  effects: Choice['effects'];
}

export function resolveChoice(choice: Choice): ResolvedChoice {
  if (choice.successRate !== undefined && choice.successRate < 100) {
    const success = rollSuccess(choice.successRate);
    if (!success && choice.failEffects) {
      return {
        success: false,
        narrative: choice.failNarrative ?? choice.narrative,
        effects: choice.failEffects,
      };
    }
    return { success, narrative: choice.narrative, effects: choice.effects };
  }

  return { success: true, narrative: choice.narrative, effects: choice.effects };
}
