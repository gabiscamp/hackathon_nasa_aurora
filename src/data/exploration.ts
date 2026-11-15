export type ExplorationRisk = 'high' | 'moderate' | 'low';

export interface ExplorationReport {
  id: string;
  title: string;
  narrative: string;
  preferredRisk: ExplorationRisk;
}

export interface ExplorationTemplate {
  id: string;
  risk: ExplorationRisk;
  title: string;
  description: string;
  durationHours: number;
  successChance: number;
  cost: { water: number; energy: number };
  reward: { water: number; energy: number; minerals: number };
}

export interface ExplorationOption extends ExplorationTemplate {
  optionNumber: 1 | 2 | 3;
}

export const EXPLORATION_REPORTS: readonly ExplorationReport[] = [
  { id: 'r01', title: 'Methane at Dawn', preferredRisk: 'high', narrative: 'The robot smelled puffs of methane gas that come and go with the seasons. Nobody knows where they come from yet, so this spot is worth drilling one day.' },
  { id: 'r02', title: 'Echoes of Jezero', preferredRisk: 'high', narrative: 'Thin layers of mud show where an old river once flowed into a lake. Water ran here long enough to shape the whole shore.' },
  { id: 'r03', title: 'The Blue Mystery', preferredRisk: 'high', narrative: 'A blue mineral shines in a strange way. The robot sealed the sample so the lab on the station can study it.' },
  { id: 'r04', title: 'Salt from a Lost Sea', preferredRisk: 'high', narrative: 'Salt crystals keep the traces of salty Martian water that dried up billions of years ago.' },
  { id: 'r05', title: 'Ice under Utopia', preferredRisk: 'moderate', narrative: 'The radar found almost pure ice just under the dusty ground. One day, it could be water for astronauts.' },
  { id: 'r06', title: 'Panels in the Sun', preferredRisk: 'moderate', narrative: 'Pieces of an old test solar panel still make a little power. The robot brought back cells and data on how sunlight wears them out.' },
  { id: 'r07', title: 'Lava Cave', preferredRisk: 'moderate', narrative: 'An opening leads into a lava tube that is safe from radiation. It could be a shelter for human explorers.' },
  { id: 'r08', title: 'Martian Blueberries', preferredRisk: 'low', narrative: 'The robot found tiny round balls of hematite. They formed long ago when minerals touched liquid water.' },
  { id: 'r09', title: 'Bubbly Rock', preferredRisk: 'low', narrative: 'Bubbles trapped in volcanic rock show how gas escaped from an old Martian volcano.' },
  { id: 'r10', title: 'Magnetic Dust', preferredRisk: 'low', narrative: 'Magnetic dust stuck to the sensors. The sample helps engineers design dust filters for future bases.' },
] as const;

export const EXPLORATION_TEMPLATES: readonly ExplorationTemplate[] = [
  { id: 'rare-life', risk: 'high', title: 'Signs of Ancient Life', description: 'Look in protected clay for signs that tiny life lived here long ago.', durationHours: 48, successChance: 0.35, cost: { water: 3, energy: 8 }, reward: { water: 0, energy: 0, minerals: 8 } },
  { id: 'rare-anomaly', risk: 'high', title: 'Canyon Mystery', description: 'Cross shaky ground to map a strange signal.', durationHours: 48, successChance: 0.38, cost: { water: 2, energy: 9 }, reward: { water: 0, energy: 2, minerals: 10 } },
  { id: 'rare-crater', risk: 'high', title: 'Crater with No Name', description: 'Go down to rock layers that never saw direct sunlight.', durationHours: 48, successChance: 0.42, cost: { water: 3, energy: 7 }, reward: { water: 2, energy: 0, minerals: 9 } },
  { id: 'medium-ice', risk: 'moderate', title: 'Ice Radar', description: 'Scan for ice under the ground and bring back a frozen sample.', durationHours: 48, successChance: 0.65, cost: { water: 2, energy: 5 }, reward: { water: 12, energy: 0, minerals: 5 } },
  { id: 'medium-panel', risk: 'moderate', title: 'Old Solar Panels', description: 'Collect solar cells from an old, empty research module.', durationHours: 48, successChance: 0.68, cost: { water: 2, energy: 4 }, reward: { water: 0, energy: 12, minerals: 4 } },
  { id: 'medium-cave', risk: 'moderate', title: 'Map a Lava Tube', description: 'Explore a cave opening that is safe from dust and radiation.', durationHours: 48, successChance: 0.62, cost: { water: 2, energy: 6 }, reward: { water: 3, energy: 3, minerals: 7 } },
  { id: 'safe-basalt', risk: 'low', title: 'Basalt Samples', description: 'Pick up rock samples on a flat road that is already mapped.', durationHours: 24, successChance: 0.9, cost: { water: 1, energy: 2 }, reward: { water: 0, energy: 0, minerals: 12 } },
  { id: 'safe-magnetic', risk: 'low', title: 'Magnet Sweep', description: 'Collect iron minerals near the landing module.', durationHours: 24, successChance: 0.92, cost: { water: 1, energy: 2 }, reward: { water: 0, energy: 1, minerals: 10 } },
  { id: 'safe-regolith', risk: 'low', title: 'Dust Samples', description: 'Collect dust and small stones in a safe area.', durationHours: 24, successChance: 0.94, cost: { water: 1, energy: 2 }, reward: { water: 0, energy: 0, minerals: 8 } },
] as const;

export const RISK_LABELS: Record<ExplorationRisk, string> = {
  high: 'Hard · High risk',
  moderate: 'Medium · Some risk',
  low: 'Easy · Low risk',
};

function randomOf<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Always returns one high-, one moderate- and one low-risk option, in that order. */
export function generateExplorationOptions(): ExplorationOption[] {
  const risks: ExplorationRisk[] = ['high', 'moderate', 'low'];
  return risks.map((risk, index) => ({
    ...randomOf(EXPLORATION_TEMPLATES.filter((template) => template.risk === risk)),
    optionNumber: (index + 1) as 1 | 2 | 3,
  }));
}
