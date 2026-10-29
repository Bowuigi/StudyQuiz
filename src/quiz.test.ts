import { describe, expect, it } from 'vitest';

import type { Subject, Topic } from './content.ts';
import { buildQuiz, correctAnswerLines, gradeAnswer, optionExplanations } from './quiz.ts';
import type { QuizActivity } from './types.d.ts';

const ALL_TYPES = [
  'multiple-choice',
  'single-choice',
  'reorder',
  'relate',
  'complete-words',
  'card',
] as const;

const singleChoice: QuizActivity = {
  is: 'single-choice',
  question: '¿Cuál es la capital de Italia?',
  options: [
    { label: 'Roma', explanation: 'Roma es la capital.' },
    { label: 'París', explanation: 'París no está en Italia.' },
    { label: 'Madrid', explanation: 'Madrid es la capital de España.' },
  ],
};

const multipleChoice: QuizActivity = {
  is: 'multiple-choice',
  question: '¿Cuáles son pares?',
  options: [
    { label: '2', isCorrect: true, explanation: '2 es par.' },
    { label: '3', isCorrect: false, explanation: '3 es impar.' },
    { label: '8', isCorrect: true, explanation: '8 es par.' },
  ],
};

const reorder: QuizActivity = {
  is: 'reorder',
  title: 'Ordena los números',
  elements: ['Uno', 'Dos', 'Tres'],
};

const relate: QuizActivity = {
  is: 'relate',
  title: 'Relaciona letras y números',
  related: { a: '1', b: '2' },
};

const completeWords: QuizActivity = {
  is: 'complete-words',
  parts: [
    { isBlank: false, label: 'El ' },
    { isBlank: true, label: 'Camión' },
    { isBlank: false, label: ' es grande.' },
  ],
};

const card: QuizActivity = {
  is: 'card',
  front: 'Frente',
  back: 'Dorso',
};

function makeTopic(id: string, activities: Array<QuizActivity>): Topic {
  const [subject = '', name = ''] = id.split('/');
  return { id, subject, name, activities };
}

const subjects: Array<Subject> = [
  {
    name: 'demo',
    topics: [
      makeTopic('demo/mezcla', [
        singleChoice,
        multipleChoice,
        reorder,
        relate,
        completeWords,
        card,
      ]),
      makeTopic('demo/otro', [
        {
          is: 'single-choice',
          question: '¿Dos más dos?',
          options: [
            { label: 'Cuatro', explanation: 'Es correcto.' },
            { label: 'Cinco', explanation: 'No es correcto.' },
          ],
        },
        { is: 'card', front: 'Otro frente', back: 'Otro dorso' },
      ]),
    ],
  },
];

function makeItem(activity: QuizActivity): {
  topicId: string;
  topicName: string;
  activity: QuizActivity;
  optionOrder: Array<number>;
} {
  return { topicId: 'demo/mezcla', topicName: 'mezcla', activity, optionOrder: [] };
}

describe('buildQuiz filtering', () => {
  it('filters activities by topic and by type', () => {
    const items = buildQuiz(subjects, {
      topicIds: ['demo/mezcla'],
      types: ['single-choice', 'card'],
      count: 99,
      random: () => 0,
    });

    expect(items).toHaveLength(2);
    expect(items.every(item => item.topicId === 'demo/mezcla')).toBe(true);
    expect(items.every(item => item.topicName === 'mezcla')).toBe(true);
    expect(items.map(item => item.activity.is).toSorted()).toEqual(['card', 'single-choice']);
  });

  it('caps the count and never returns duplicates', () => {
    const items = buildQuiz(subjects, {
      topicIds: ['demo/mezcla', 'demo/otro'],
      types: [...ALL_TYPES],
      count: 3,
      random: () => 0.42,
    });

    expect(items).toHaveLength(3);
    expect(new Set(items.map(item => item.activity)).size).toBe(3);
  });

  it('returns every available activity when the count is larger', () => {
    const items = buildQuiz(subjects, {
      topicIds: ['demo/mezcla', 'demo/otro'],
      types: [...ALL_TYPES],
      count: 100,
      random: () => 0.42,
    });

    expect(items).toHaveLength(8);
    expect(new Set(items.map(item => item.activity)).size).toBe(8);
  });
});

describe('buildQuiz shuffling', () => {
  it('is deterministic with a fixed random function', () => {
    const first = buildQuiz(subjects, {
      topicIds: ['demo/mezcla'],
      types: [...ALL_TYPES],
      count: 6,
      random: () => 0.37,
    });
    const second = buildQuiz(subjects, {
      topicIds: ['demo/mezcla'],
      types: [...ALL_TYPES],
      count: 6,
      random: () => 0.37,
    });

    expect(first.map(item => item.activity)).toEqual(second.map(item => item.activity));
    expect(first.map(item => item.optionOrder)).toEqual(second.map(item => item.optionOrder));
  });

  it('shuffles the options of choice activities into a permutation', () => {
    const items = buildQuiz(subjects, {
      topicIds: ['demo/mezcla'],
      types: ['single-choice', 'multiple-choice'],
      count: 2,
      random: () => 0.5,
    });

    for (const item of items) {
      if (item.activity.is === 'single-choice' || item.activity.is === 'multiple-choice') {
        const sorted = [...item.optionOrder].sort((a, b) => a - b);
        expect(sorted).toEqual(item.activity.options.map((_, index) => index));
      }
    }
  });
});

describe('gradeAnswer for choice activities', () => {
  it('grades single choice answers', () => {
    const item = makeItem(singleChoice);

    expect(gradeAnswer(item, { is: 'single-choice', selected: 0 }).correct).toBe(true);
    expect(gradeAnswer(item, { is: 'single-choice', selected: 2 }).correct).toBe(false);
  });

  it('grades multiple choice answers as a set', () => {
    const item = makeItem(multipleChoice);

    expect(gradeAnswer(item, { is: 'multiple-choice', selected: [0, 2] }).correct).toBe(true);
    expect(gradeAnswer(item, { is: 'multiple-choice', selected: [2, 0] }).correct).toBe(true);
    expect(gradeAnswer(item, { is: 'multiple-choice', selected: [0] }).correct).toBe(false);
    expect(gradeAnswer(item, { is: 'multiple-choice', selected: [0, 1, 2] }).correct).toBe(false);
  });
});

describe('gradeAnswer for ordered activities', () => {
  it('grades reorder answers against the original order', () => {
    const item = makeItem(reorder);

    expect(gradeAnswer(item, { is: 'reorder', order: ['Uno', 'Dos', 'Tres'] }).correct).toBe(true);
    expect(gradeAnswer(item, { is: 'reorder', order: ['Dos', 'Uno', 'Tres'] }).correct).toBe(false);
  });

  it('grades relate answers key by key', () => {
    const item = makeItem(relate);

    expect(gradeAnswer(item, { is: 'relate', pairs: { a: '1', b: '2' } }).correct).toBe(true);
    expect(gradeAnswer(item, { is: 'relate', pairs: { a: '1', b: 'X' } }).correct).toBe(false);
    expect(gradeAnswer(item, { is: 'relate', pairs: { a: '1' } }).correct).toBe(false);
  });
});

describe('gradeAnswer for written activities', () => {
  it('grades complete words answers', () => {
    const item = makeItem(completeWords);

    expect(gradeAnswer(item, { is: 'complete-words', blanks: ['Camión'] }).correct).toBe(true);
    expect(gradeAnswer(item, { is: 'complete-words', blanks: ['Casa'] }).correct).toBe(false);
  });

  it('ignores case, accents, and surrounding spaces in complete words', () => {
    const item = makeItem(completeWords);

    expect(gradeAnswer(item, { is: 'complete-words', blanks: ['  camion '] }).correct).toBe(true);
    expect(gradeAnswer(item, { is: 'complete-words', blanks: [' CAMIÓN  '] }).correct).toBe(true);
  });

  it('grades cards with the self assessment', () => {
    const item = makeItem(card);

    expect(gradeAnswer(item, { is: 'card', known: true }).correct).toBe(true);
    expect(gradeAnswer(item, { is: 'card', known: false }).correct).toBe(false);
  });
});

describe('answer descriptions', () => {
  const activities = [singleChoice, multipleChoice, reorder, relate, completeWords, card];

  it('never contains blank fields', () => {
    for (const activity of activities) {
      const lines = correctAnswerLines(makeItem(activity));

      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        expect(line.trim()).not.toBe('');
        expect(line).not.toContain('undefined');
        expect(line).not.toContain('null');
      }
    }
  });

  it('describes the generated-type answers', () => {
    expect(correctAnswerLines(makeItem(reorder))).toEqual(['1. Uno', '2. Dos', '3. Tres']);
    expect(correctAnswerLines(makeItem(relate))).toEqual(['a: 1', 'b: 2']);
    expect(correctAnswerLines(makeItem(completeWords))).toEqual(['El Camión es grande.']);
  });

  it('returns option explanations and the card back text', () => {
    expect(optionExplanations(makeItem(singleChoice))).toEqual([
      'Roma: Roma es la capital.',
      'París: París no está en Italia.',
      'Madrid: Madrid es la capital de España.',
    ]);
    expect(optionExplanations(makeItem(card))).toEqual(['Dorso']);
  });
});
