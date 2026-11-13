import { BarChart3, Book } from 'lucide-preact';
import type { JSX } from 'preact';

import type { Subject } from '../content.ts';
import { formatDisplayName } from '../format.ts';

type HomeViewProps = {
  subjects: Array<Subject>;
  onSelectSubject: (subject: Subject) => void;
  onOpenStats: () => void;
};

function countActivities(subject: Subject): number {
  return subject.topics.reduce((total, topic) => total + topic.activities.length, 0);
}

function subjectCard(subject: Subject, onSelectSubject: (subject: Subject) => void): JSX.Element {
  const activities = countActivities(subject);
  const topics = subject.topics.length;

  return (
    <button
      type="button"
      class="card card-border bg-base-200 shadow-sm"
      onClick={() => {
        onSelectSubject(subject);
      }}>
      <div class="card-body p-4 flex flex-col items-center justify-center gap-1 text-center">
        <div class="flex flex-row items-center gap-1">
          <Book size="1.2em" class="text-base-content" />
          <h3 class="card-title text-base">{formatDisplayName(subject.name)}</h3>
        </div>
        <p class="text-sm text-base-content/70">
          {activities} {activities === 1 ? 'actividad' : 'actividades'}
        </p>
        <p class="text-sm text-base-content/70">
          {topics} {topics === 1 ? 'tema' : 'temas'}
        </p>
      </div>
    </button>
  );
}

export function HomeView({ subjects, onSelectSubject, onOpenStats }: HomeViewProps): JSX.Element {
  return (
    <div class="flex flex-col gap-6">
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body gap-4">
          <h2 class="card-title">Intentar</h2>
          <p class="text-base-content/70">Practica con cuestionarios y revisa tu progreso.</p>

          {subjects.length === 0 ? (
            <div class="alert">
              <span>No hay contenido disponible.</span>
            </div>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {subjects.map(subject => subjectCard(subject, onSelectSubject))}
            </div>
          )}
        </div>
      </div>

      <div class="card bg-base-100 shadow-sm">
        <div class="card-body gap-4">
          <h2 class="card-title">Estadísticas</h2>
          <p class="text-base-content/70">Revisa tu progreso por tema y tipo de actividad.</p>
          <div class="card-actions">
            <button type="button" class="btn" onClick={onOpenStats}>
              <BarChart3 size="1em" />
              Ver estadísticas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
