import type { QuizActivityType } from './quiz.ts';

export interface ActivityTypeOption {
  type: QuizActivityType;
  label: string;
}

export const ACTIVITY_TYPES: Array<ActivityTypeOption> = [
  { type: 'multiple-choice', label: 'Opción múltiple' },
  { type: 'single-choice', label: 'Opción única' },
  { type: 'reorder', label: 'Ordenar' },
  { type: 'relate', label: 'Relacionar' },
  { type: 'complete-words', label: 'Completar palabras' },
  { type: 'card', label: 'Tarjetas' },
];
