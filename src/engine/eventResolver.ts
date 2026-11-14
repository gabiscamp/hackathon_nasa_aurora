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
  consequences: Choice['consequences'];
  narrative: string;
}

export function resolveChoice(choice: Choice): ResolvedChoice {
  const { consequences } = choice;
  const { successRate } = consequences;

  if (successRate !== undefined && successRate < 100) {
    const success = rollSuccess(successRate);
    if (!success && consequences.failEffects) {
      return {
        success: false,
        consequences: {
          ...consequences.failEffects,
          narrative: consequences.failNarrative ?? consequences.narrative,
        },
        narrative: consequences.failNarrative ?? consequences.narrative,
      };
    }
    return {
      success,
      consequences,
      narrative: consequences.narrative,
    };
  }

  return {
    success: true,
    consequences,
    narrative: consequences.narrative,
  };
}
