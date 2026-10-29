import type { JSX } from 'preact';

import type { CardActivity as CardData } from '../types.d.ts';

interface CardActivityProps {
  activity: CardData;
  revealed: boolean;
  confirmed: boolean;
  onReveal: () => void;
  onGrade: (known: boolean) => void;
}

export function CardActivity({
  activity,
  revealed,
  confirmed,
  onReveal,
  onGrade,
}: CardActivityProps): JSX.Element {
  return (
    <div class="flex flex-col gap-4">
      <p class="text-sm tracking-wide text-base-content/60 uppercase">Tarjeta</p>
      <h2 class="text-xl font-bold">{activity.front}</h2>

      {revealed ? (
        <div class="alert alert-info">
          <span>{activity.back}</span>
        </div>
      ) : null}

      {confirmed ? null : (
        <div class="card-actions">
          {revealed ? (
            <>
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
            </>
          ) : (
            <button type="button" class="btn" onClick={onReveal}>
              Mostrar respuesta
            </button>
          )}
        </div>
      )}
    </div>
  );
}
