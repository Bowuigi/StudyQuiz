import { describe, expect, it } from 'vitest';

import { buildSubjects, loadSubjects } from './content.ts';

const ACTIVITY_TYPES = [
  'multiple-choice',
  'single-choice',
  'reorder',
  'relate',
  'complete-words',
  'card',
];

describe('content loader', () => {
  it('returns every sample subject and topic', () => {
    const subjects = loadSubjects();
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
    for (const subject of loadSubjects()) {
      for (const topic of subject.topics) {
        expect(topic.id).toBe(`${subject.name}/${topic.name}`);
        expect(topic.subject).toBe(subject.name);
      }
    }
  });

  it('sorts subjects and topics by name', () => {
    const subjects = loadSubjects();
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
      loadSubjects().flatMap(subject =>
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
