export interface CrewMember {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  skill: 'engineering' | 'medical' | 'science' | 'leadership';
  health: number;
  morale: number;
  color: string;
  phrase: string;
  description: string;
  skills: { label: string; value: number }[];
}

export const CREW_DEFINITIONS: Omit<CrewMember, 'health' | 'morale'>[] = [
  {
    id: 'kira',
    name: 'Kira Santos',
    role: 'engineer',
    roleLabel: 'Flight Engineer',
    skill: 'engineering',
    color: '#f59e0b',
    phrase: '"Give me duct tape and I can fix anything."',
    description: 'Kira fixes everything. If a machine breaks, she handles it. She takes care of oxygen, water, and energy systems.',
    skills: [
      { label: 'Engineering', value: 95 },
      { label: 'EVA', value: 80 },
      { label: 'Piloting', value: 50 },
      { label: 'Medical', value: 30 },
      { label: 'Science', value: 25 },
    ],
  },
  {
    id: 'leo',
    name: 'Dr. Leo Park',
    role: 'medic',
    roleLabel: 'Medical Officer',
    skill: 'medical',
    color: '#10b981',
    phrase: '"A healthy crew is a crew that survives."',
    description: 'Leo takes care of everyone. If someone gets hurt or sick, he treats them. He also helps when someone feels sad or stressed.',
    skills: [
      { label: 'Medical', value: 95 },
      { label: 'Psychology', value: 85 },
      { label: 'Biology', value: 60 },
      { label: 'Engineering', value: 25 },
      { label: 'Piloting', value: 20 },
    ],
  },
  {
    id: 'maya',
    name: 'Maya Torres',
    role: 'scientist',
    roleLabel: 'Science Officer',
    skill: 'science',
    color: '#8b5cf6',
    phrase: '"Commander, you need to see this data!"',
    description: 'Maya makes the discoveries. She watches the sensors, studies Mars data, and monitors space weather. When a solar storm is coming, she warns you.',
    skills: [
      { label: 'Science', value: 95 },
      { label: 'Data Analysis', value: 85 },
      { label: 'Biology', value: 60 },
      { label: 'Engineering', value: 30 },
      { label: 'Medical', value: 25 },
    ],
  },
];
