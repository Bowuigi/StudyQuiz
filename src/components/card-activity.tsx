import type { JSX } from 'preact';

import type { CardActivity as CardData } from '../types.d.ts';

interface CardActivityProps {
  activity: CardData;
  flipped: boolean;
  onFlip: () => void;
  onGrade: (known: boolean) => void;
}

export function CardActivity({
  activity,
  flipped,
  onFlip,
  onGrade,
}: CardActivityProps): JSX.Element {
  return (
    <div class="flex flex-col gap-4">
      <div class="flex justify-center card-perspective">
        <button
          type="button"
          class="card card-border shadow card-flip w-[60%] aspect-3/2"
          onClick={onFlip}
          data-flipped={flipped ? '' : undefined}>
          <div class="card-face card-front p-4 flex flex-col items-center justify-center vertical-align-center gap-2">
            <h2 class="text-xl font-bold">{activity.front}</h2>
          </div>
          <div class="card-face card-back p-4 flex flex-row items-center justify-center gap-2">
            <p class="text-lg">{activity.back}</p>
          </div>
        </button>
      </div>

      {flipped ? (
        <div class="flex justify-center gap-2">
          <button
            type="button"
            class="btn btn-success"
            onClick={() => {
              onGrade(true);
            }}>
            Lo sé
          </button>
          <button
            type="button"
            class="btn btn-error"
            onClick={() => {
              onGrade(false);
            }}>
            Me olvidé
          </button>
        </div>
      ) : null}
    </div>
  );
}
