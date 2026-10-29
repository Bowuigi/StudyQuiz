import type { JSX } from 'preact';

import { type QuizItem, optionExplanations } from '../quiz.ts';

interface ActivityFeedbackProps {
  item: QuizItem;
  correct: boolean;
}

export function ActivityFeedback({ item, correct }: ActivityFeedbackProps): JSX.Element {
  return (
    <div class={correct ? 'alert alert-success' : 'alert alert-error'}>
      <div class="flex flex-col gap-1">
        <p class="font-semibold">{correct ? 'Correcto' : 'Incorrecto'}</p>
        {optionExplanations(item).map(line => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}
