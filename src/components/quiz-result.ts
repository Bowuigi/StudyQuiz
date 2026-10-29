import type { QuizAnswer, QuizItem } from '../quiz.ts';

export interface QuizResult {
  item: QuizItem;
  answer: QuizAnswer;
  correct: boolean;
}
