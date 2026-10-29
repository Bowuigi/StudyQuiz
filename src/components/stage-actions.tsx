import type { JSX } from 'preact';

interface StageActionsProps {
  confirmed: boolean;
  onNext: () => void;
  onConfirm?: () => void;
}

export function StageActions({ confirmed, onNext, onConfirm }: StageActionsProps): JSX.Element {
  return (
    <div class="card-actions justify-end">
      {confirmed ? (
        <button type="button" class="btn btn-primary" onClick={onNext}>
          Siguiente
        </button>
      ) : null}
      {!confirmed && onConfirm !== undefined ? (
        <button type="button" class="btn btn-primary" onClick={onConfirm}>
          Confirmar
        </button>
      ) : null}
    </div>
  );
}
