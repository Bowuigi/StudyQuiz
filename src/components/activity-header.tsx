import { CircleCheck, CircleX } from 'lucide-preact';
import type { JSX } from 'preact';

import { ACTIVITY_TYPES } from '../activity-types.ts';
import type { QuizActivityType } from '../quiz.ts';

type ActivityHeaderProps = {
  type: QuizActivityType;
  status: boolean | null;
};

export function ActivityHeader({ type, status }: ActivityHeaderProps): JSX.Element {
  const { label } = ACTIVITY_TYPES.find(option => option.type === type) ?? { label: type };

  return (
    <div class="flex items-center justify-between gap-2">
      <span class="text-xs font-semibold text-base-content/60">{label}</span>
      {status === null ? null : (
        <span
          class={`${status ? 'text-success' : 'text-error'} font-bold text-xs flex items-center gap-1.5`}>
          {status ? <CircleCheck size="1.2em" /> : <CircleX size="1.2em" />}
          {status ? 'Respuesta correcta' : 'Respuesta incorrecta'}
        </span>
      )}
    </div>
  );
}
