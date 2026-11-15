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
  { id: 'r01', title: 'Metano ao Amanhecer', preferredRisk: 'high', narrative: 'O espectrômetro detectou pulsos sazonais de metano. A origem ainda é incerta, mas o ponto merece uma futura perfuração.' },
  { id: 'r02', title: 'Ecos de Jezero', preferredRisk: 'high', narrative: 'Camadas finas de sedimento registram um antigo delta. A água correu aqui por tempo suficiente para remodelar toda a margem.' },
  { id: 'r03', title: 'A Anomalia Azul', preferredRisk: 'high', narrative: 'Uma inclusão mineral azul reflete luz de modo incomum. A amostra foi selada para análise no laboratório orbital.' },
  { id: 'r04', title: 'Sal de um Mar Perdido', preferredRisk: 'high', narrative: 'Cristais de sulfato preservam a assinatura química de uma salmoura marciana que evaporou há bilhões de anos.' },
  { id: 'r05', title: 'Gelo sob Utopia', preferredRisk: 'moderate', narrative: 'O radar encontrou uma lente de gelo quase puro sob uma camada rasa de regolito: uma futura reserva de água.' },
  { id: 'r06', title: 'Silício ao Sol', preferredRisk: 'moderate', narrative: 'Fragmentos de um painel experimental ainda produzem corrente. O robô recuperou células e dados de degradação solar.' },
  { id: 'r07', title: 'Caverna de Lava', preferredRisk: 'moderate', narrative: 'Uma abertura leva a um tubo de lava protegido da radiação. O local pode servir de abrigo para exploradores humanos.' },
  { id: 'r08', title: 'Hematita Esférica', preferredRisk: 'low', narrative: 'A coleta revelou pequenas esferas de hematita, formadas quando minerais interagiram com água líquida.' },
  { id: 'r09', title: 'Basalto Vesicular', preferredRisk: 'low', narrative: 'Bolhas presas no basalto contam como gases escaparam de uma antiga erupção vulcânica marciana.' },
  { id: 'r10', title: 'Poeira Magnética', preferredRisk: 'low', narrative: 'Grãos ricos em magnetita aderiram aos sensores. A amostra ajuda a projetar filtros para futuras bases.' },
] as const;

export const EXPLORATION_TEMPLATES: readonly ExplorationTemplate[] = [
  { id: 'rare-life', risk: 'high', title: 'Vestígios de vida antiga', description: 'Investigar argilas protegidas em busca de bioassinaturas.', durationHours: 48, successChance: 0.35, cost: { water: 3, energy: 8 }, reward: { water: 0, energy: 0, minerals: 8 } },
  { id: 'rare-anomaly', risk: 'high', title: 'Anomalia do cânion', description: 'Cruzar terreno instável para mapear uma leitura desconhecida.', durationHours: 48, successChance: 0.38, cost: { water: 2, energy: 9 }, reward: { water: 0, energy: 2, minerals: 10 } },
  { id: 'rare-crater', risk: 'high', title: 'Cratera sem nome', description: 'Descer até camadas que nunca receberam luz direta.', durationHours: 48, successChance: 0.42, cost: { water: 3, energy: 7 }, reward: { water: 2, energy: 0, minerals: 9 } },
  { id: 'medium-ice', risk: 'moderate', title: 'Radar de gelo subterrâneo', description: 'Sondar depósitos rasos e trazer uma amostra congelada.', durationHours: 48, successChance: 0.65, cost: { water: 2, energy: 5 }, reward: { water: 12, energy: 0, minerals: 5 } },
  { id: 'medium-panel', risk: 'moderate', title: 'Recuperar painéis antigos', description: 'Buscar células solares de um módulo de pesquisa abandonado.', durationHours: 48, successChance: 0.68, cost: { water: 2, energy: 4 }, reward: { water: 0, energy: 12, minerals: 4 } },
  { id: 'medium-cave', risk: 'moderate', title: 'Mapear tubo de lava', description: 'Explorar uma entrada protegida de poeira e radiação.', durationHours: 48, successChance: 0.62, cost: { water: 2, energy: 6 }, reward: { water: 3, energy: 3, minerals: 7 } },
  { id: 'safe-basalt', risk: 'low', title: 'Coleta de basalto', description: 'Recolher amostras em uma rota plana já mapeada.', durationHours: 24, successChance: 0.9, cost: { water: 1, energy: 2 }, reward: { water: 0, energy: 0, minerals: 12 } },
  { id: 'safe-magnetic', risk: 'low', title: 'Varredura magnética', description: 'Separar minerais ferrosos perto do módulo de pouso.', durationHours: 24, successChance: 0.92, cost: { water: 1, energy: 2 }, reward: { water: 0, energy: 1, minerals: 10 } },
  { id: 'safe-regolith', risk: 'low', title: 'Amostras de regolito', description: 'Coletar poeira e cascalho em perímetro seguro.', durationHours: 24, successChance: 0.94, cost: { water: 1, energy: 2 }, reward: { water: 0, energy: 0, minerals: 8 } },
] as const;

export const RISK_LABELS: Record<ExplorationRisk, string> = {
  high: 'Baixa probabilidade · Alto risco',
  moderate: 'Média probabilidade · Risco moderado',
  low: 'Alta probabilidade · Baixo risco',
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
