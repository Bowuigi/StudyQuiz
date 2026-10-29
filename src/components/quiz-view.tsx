import type { JSX } from 'preact';

import type { QuizItem } from '../quiz.ts';

interface QuizViewProps {
  quiz: Array<QuizItem>;
  onExit: () => void;
}

export function QuizView({ quiz, onExit }: QuizViewProps): JSX.Element {
  return (
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body gap-4">
        <h2 class="card-title">Cuestionario</h2>
        <p>
          {quiz.length} {quiz.length === 1 ? 'actividad' : 'actividades'}
        </p>
        <p class="text-base-content/70">
          El cuestionario interactivo estará disponible en la siguiente fase.
        </p>
        <div class="card-actions">
          <button type="button" class="btn" onClick={onExit}>
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
