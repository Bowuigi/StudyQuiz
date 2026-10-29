import type { QuizActivity } from './types.d.ts';

export interface Topic {
  id: string;
  subject: string;
  name: string;
  activities: Array<QuizActivity>;
}

export interface Subject {
  name: string;
  topics: Array<Topic>;
}

const contentModules = import.meta.glob<Array<QuizActivity>>('../content/**/*.json', {
  eager: true,
  import: 'default',
});

export function buildSubjects(modules: Record<string, Array<QuizActivity>>): Array<Subject> {
  const topicsBySubject = new Map<string, Array<Topic>>();

  for (const [path, activities] of Object.entries(modules)) {
    const relativePath = path.replace(/^.*\/content\//, '');
    const [subjectName, ...remainingSegments] = relativePath.split('/');
    const fileName = remainingSegments.at(-1);

    if (
      subjectName !== undefined &&
      subjectName !== '' &&
      fileName !== undefined &&
      fileName !== ''
    ) {
      const topicName = fileName.replace(/\.json$/, '');
      const topic: Topic = {
        id: `${subjectName}/${topicName}`,
        subject: subjectName,
        name: topicName,
        activities,
      };

      const topics = topicsBySubject.get(subjectName) ?? [];
      topics.push(topic);
      topicsBySubject.set(subjectName, topics);
    }
  }

  const subjects: Array<Subject> = [];

  for (const [name, topics] of topicsBySubject) {
    topics.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    subjects.push({ name, topics });
  }

  subjects.sort((a, b) => a.name.localeCompare(b.name, 'es'));

  return subjects;
}

export function loadSubjects(): Array<Subject> {
  return buildSubjects(contentModules);
}
