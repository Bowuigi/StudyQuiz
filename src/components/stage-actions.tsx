import { ArrowRight, Check } from 'lucide-preact';
import type { JSX } from 'preact';

type StageActionsProps = {
  confirmed: boolean;
  onNext: () => void;
  onConfirm?: () => void;
};

export function StageActions({ confirmed, onNext, onConfirm }: StageActionsProps): JSX.Element {
  return (
    <div class="card-actions justify-end">
      {confirmed ? (
        <button type="button" class="btn btn-primary" onClick={onNext}>
          <ArrowRight size="1.2em" />
          Siguiente
        </button>
      ) : null}
      {!confirmed && onConfirm !== undefined ? (
        <button type="button" class="btn btn-primary" onClick={onConfirm}>
          <Check size="1.2em" />
          Confirmar
        </button>
      ) : null}
    </div>
  );
}
