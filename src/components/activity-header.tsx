import type { JSX } from 'preact';

import { ACTIVITY_TYPES } from '../activity-types.ts';
import type { QuizActivityType } from '../quiz.ts';

interface ActivityHeaderProps {
  type: QuizActivityType;
  status: boolean | null;
}

export function ActivityHeader({ type, status }: ActivityHeaderProps): JSX.Element {
  const { label } = ACTIVITY_TYPES.find(option => option.type === type) ?? { label: type };

  return (
    <div class="flex flex-col gap-1">
      <span class="text-xs font-semibold uppercase text-base-content/60">{label}</span>
      {status === null ? null : (
        <span class={`text-xs font-semibold ${status ? 'text-success' : 'text-error'}`}>
          {status ? 'Respuesta Correcta' : 'Respuesta Incorrecta'}
        </span>
      )}
    </div>
  );
}
