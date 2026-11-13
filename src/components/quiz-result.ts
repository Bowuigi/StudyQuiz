import type { QuizAnswer, QuizItem } from '../quiz.ts';

export type QuizResult = {
  item: QuizItem;
  answer: QuizAnswer;
  correct: boolean;
};
