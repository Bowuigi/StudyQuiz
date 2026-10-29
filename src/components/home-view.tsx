import type { JSX } from 'preact';

import type { Subject } from '../content.ts';

interface HomeViewProps {
  subjects: Array<Subject>;
  onSelectSubject: (subject: Subject) => void;
  onOpenStats: () => void;
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
            <div class="flex flex-col gap-2">
              {subjects.map(subject => (
                <button
                  key={subject.name}
                  type="button"
                  class="btn justify-start"
                  onClick={() => {
                    onSelectSubject(subject);
                  }}>
                  {subject.name}
                </button>
              ))}
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
              Ver estadísticas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
