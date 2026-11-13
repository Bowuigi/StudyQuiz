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
    <div class="flex flex-col gap-2">
      <span class="text-xs font-semibold uppercase text-base-content/60">{label}</span>
      {status === null ? null : (
        <span
          class={`text-xs font-semibold flex items-center gap-1 ${status ? 'text-success' : 'text-error'}`}>
          {status ? <CircleCheck size="1.5em" /> : <CircleX size="1.5em" />}
          {status ? 'Respuesta correcta' : 'Respuesta incorrecta'}
        </span>
      )}
    </div>
  );
}
