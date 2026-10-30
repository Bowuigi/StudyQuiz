import { describe, expect, it } from 'vitest';

import { buildSubjects } from './content.ts';
import type { QuizActivity } from './types.d.ts';

const ACTIVITY_TYPES = [
  'multiple-choice',
  'single-choice',
  'reorder',
  'relate',
  'complete-words',
  'card',
];

// Fixtures replace the real content folder so this test does not depend on it.
const sampleModules: Record<string, Array<QuizActivity>> = {
  '../content/historia/antigua-roma.json': [
    { is: 'card', front: '¿Cuál era la capital del Imperio romano?', back: 'Roma.' },
  ],
  '../content/historia/revolucion-francesa.json': [
    {
      is: 'single-choice',
      question: '¿Quién fue el primer emperador romano?',
      options: [
        { label: 'Augusto', explanation: 'Augusto gobernó desde el año 27 a. C.' },
        { label: 'Julio César', explanation: 'Julio César fue dictador, no emperador.' },
      ],
    },
  ],
  '../content/ingles/verbos-irregulares.json': [
    {
      is: 'multiple-choice',
      question: '¿Cuál es el pasado de go?',
      options: [
        { label: 'went', isCorrect: true, explanation: 'Went es el pasado de go.' },
        { label: 'goed', isCorrect: false, explanation: 'No existe en inglés.' },
      ],
    },
  ],
  '../content/ingles/vocabulario.json': [
    { is: 'reorder', title: 'Ordena las palabras', elements: ['one', 'two', 'three'] },
  ],
  '../content/matematicas/fracciones.json': [
    {
      is: 'relate',
      title: 'Relaciona fracciones y decimales',
      related: { '1/2': '0.5', '1/4': '0.25' },
    },
  ],
  '../content/matematicas/geometria.json': [
    {
      is: 'complete-words',
      parts: [
        { isBlank: false, label: 'Un triángulo tiene ' },
        { isBlank: true, label: 'tres' },
        { isBlank: false, label: ' lados.' },
      ],
    },
  ],
};

const subjects = buildSubjects(sampleModules);

describe('content loader', () => {
  it('returns every sample subject and topic', () => {
    const layout = subjects.map(subject => ({
      subject: subject.name,
      topics: subject.topics.map(topic => topic.name),
    }));

    expect(layout).toEqual([
      { subject: 'historia', topics: ['antigua-roma', 'revolucion-francesa'] },
      { subject: 'ingles', topics: ['verbos-irregulares', 'vocabulario'] },
      { subject: 'matematicas', topics: ['fracciones', 'geometria'] },
    ]);
  });

  it('uses the subject/topic form for topic ids', () => {
    for (const subject of subjects) {
      for (const topic of subject.topics) {
        expect(topic.id).toBe(`${subject.name}/${topic.name}`);
        expect(topic.subject).toBe(subject.name);
      }
    }
  });

  it('sorts subjects and topics by name', () => {
    const subjectNames = subjects.map(subject => subject.name);

    expect(subjectNames).toEqual([...subjectNames].sort((a, b) => a.localeCompare(b, 'es')));

    for (const subject of subjects) {
      const topicNames = subject.topics.map(topic => topic.name);
      expect(topicNames).toEqual([...topicNames].sort((a, b) => a.localeCompare(b, 'es')));
    }
  });
});

describe('sample content', () => {
  it('includes every activity type in the sample data', () => {
    const types = new Set(
      subjects.flatMap(subject =>
        subject.topics.flatMap(topic => topic.activities.map(activity => activity.is)),
      ),
    );

    expect([...types].sort((a, b) => a.localeCompare(b, 'es'))).toEqual(
      [...ACTIVITY_TYPES].sort((a, b) => a.localeCompare(b, 'es')),
    );
  });

  it('returns an empty list for an empty content directory', () => {
    expect(buildSubjects({})).toEqual([]);
  });
});
