import type { JSX } from 'preact';

import { type QuizItem, correctAnswerLines, optionExplanations } from '../quiz.ts';

interface ActivityFeedbackProps {
  item: QuizItem;
  correct: boolean;
}

function isGeneratedType(item: QuizItem): boolean {
  return (
    item.activity.is === 'reorder' ||
    item.activity.is === 'relate' ||
    item.activity.is === 'complete-words'
  );
}

export function ActivityFeedback({ item, correct }: ActivityFeedbackProps): JSX.Element {
  const lines = isGeneratedType(item) ? correctAnswerLines(item) : optionExplanations(item);

  return (
    <div class={correct ? 'alert alert-success' : 'alert alert-error'}>
      <div class="flex flex-col gap-1">
        <p class="font-semibold">{correct ? 'Correcto' : 'Incorrecto'}</p>
        {isGeneratedType(item) ? <p class="font-semibold">Respuesta correcta</p> : null}
        {lines.map(line => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}
