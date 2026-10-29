import type { Subject } from './content.ts';
import type { QuizActivity } from './types.d.ts';

export type QuizActivityType = QuizActivity['is'];

export type RandomFn = () => number;

export interface BuildQuizOptions {
  topicIds: Array<string>;
  types: Array<QuizActivityType>;
  count: number;
  random?: RandomFn;
}

export interface QuizItem {
  topicId: string;
  topicName: string;
  activity: QuizActivity;
  /** Display order of the options. Each value is an index into the activity options. */
  optionOrder: Array<number>;
}

export interface Grade {
  correct: boolean;
  correctAnswer: string;
}

export interface SingleChoiceAnswer {
  is: 'single-choice';
  selected: number;
}

export interface MultipleChoiceAnswer {
  is: 'multiple-choice';
  selected: Array<number>;
}

export interface ReorderAnswer {
  is: 'reorder';
  order: Array<string>;
}

export interface RelateAnswer {
  is: 'relate';
  pairs: Record<string, string>;
}

export interface CompleteWordsAnswer {
  is: 'complete-words';
  blanks: Array<string>;
}

export interface CardAnswer {
  is: 'card';
  known: boolean;
}

export type QuizAnswer =
  | SingleChoiceAnswer
  | MultipleChoiceAnswer
  | ReorderAnswer
  | RelateAnswer
  | CompleteWordsAnswer
  | CardAnswer;

function shuffle<T>(values: Array<T>, random: RandomFn): Array<T> {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.min(index, Math.floor(random() * (index + 1)));
    const current = result[index]!;
    result[index] = result[otherIndex]!;
    result[otherIndex] = current;
  }

  return result;
}

function shuffledOptionOrder(activity: QuizActivity, random: RandomFn): Array<number> {
  if (activity.is === 'single-choice' || activity.is === 'multiple-choice') {
    return shuffle(
      activity.options.map((_, index) => index),
      random,
    );
  }

  return [];
}

export function buildQuiz(subjects: Array<Subject>, options: BuildQuizOptions): Array<QuizItem> {
  const random = options.random ?? Math.random;
  const topicIds = new Set(options.topicIds);
  const types = new Set(options.types);

  const candidates = subjects.flatMap(subject =>
    subject.topics
      .filter(topic => topicIds.has(topic.id))
      .flatMap(topic =>
        topic.activities
          .filter(activity => types.has(activity.is))
          .map(activity => ({
            topicId: topic.id,
            topicName: topic.name,
            activity,
            optionOrder: shuffledOptionOrder(activity, random),
          })),
      ),
  );

  const limit = Math.max(0, Math.min(options.count, candidates.length));
  return shuffle(candidates, random).slice(0, limit);
}

function normalize(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036F]/g, '');
}

function sameNumberSet(first: Array<number>, second: Array<number>): boolean {
  const left = [...new Set(first)].sort((a, b) => a - b);
  const right = [...new Set(second)].sort((a, b) => a - b);

  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function isCorrect(activity: QuizActivity, answer: QuizAnswer): boolean {
  switch (activity.is) {
    case 'single-choice': {
      return answer.is === 'single-choice' && answer.selected === 0;
    }

    case 'multiple-choice': {
      if (answer.is !== 'multiple-choice') return false;

      const correctIndexes = activity.options.flatMap((option, index) =>
        option.isCorrect ? [index] : [],
      );
      return sameNumberSet(correctIndexes, answer.selected);
    }

    case 'reorder': {
      return (
        answer.is === 'reorder' &&
        activity.elements.length === answer.order.length &&
        activity.elements.every((element, index) => element === answer.order[index])
      );
    }

    case 'relate': {
      return (
        answer.is === 'relate' &&
        Object.entries(activity.related).every(([key, value]) => answer.pairs[key] === value)
      );
    }

    case 'complete-words': {
      if (answer.is !== 'complete-words') return false;

      const blanks = activity.parts.filter(part => part.isBlank).map(part => part.label);
      return (
        blanks.length === answer.blanks.length &&
        blanks.every((label, index) => normalize(label) === normalize(answer.blanks[index] ?? ''))
      );
    }

    case 'card': {
      return answer.is === 'card' && answer.known;
    }

    default: {
      return false;
    }
  }
}

export function correctAnswerLines(item: QuizItem): Array<string> {
  const { activity } = item;

  switch (activity.is) {
    case 'single-choice': {
      const [firstOption] = activity.options;
      return firstOption ? [firstOption.label] : [];
    }

    case 'multiple-choice': {
      return activity.options.filter(option => option.isCorrect).map(option => option.label);
    }

    case 'reorder': {
      return activity.elements.map((element, index) => `${index + 1}. ${element}`);
    }

    case 'relate': {
      return Object.entries(activity.related).map(([key, value]) => `${key}: ${value}`);
    }

    case 'complete-words': {
      return [activity.parts.map(part => part.label).join('')];
    }

    case 'card': {
      return [activity.back];
    }

    default: {
      return [];
    }
  }
}

export function gradeAnswer(item: QuizItem, answer: QuizAnswer): Grade {
  return {
    correct: isCorrect(item.activity, answer),
    correctAnswer: correctAnswerLines(item).join('\n'),
  };
}

export function optionExplanations(item: QuizItem): Array<string> {
  const { activity } = item;

  switch (activity.is) {
    case 'single-choice':
    case 'multiple-choice': {
      return activity.options.map(option => `${option.label}: ${option.explanation}`);
    }

    case 'reorder':
    case 'relate':
    case 'complete-words': {
      return [];
    }

    case 'card': {
      return [activity.back];
    }

    default: {
      return [];
    }
  }
}
