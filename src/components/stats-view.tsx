import type { JSX } from 'preact';

interface StatsViewProps {
  onBack: () => void;
}

export function StatsView({ onBack }: StatsViewProps): JSX.Element {
  return (
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body gap-4">
        <h2 class="card-title">Estadísticas</h2>
        <p class="text-base-content/70">Las estadísticas estarán disponibles próximamente.</p>
        <div class="card-actions">
          <button type="button" class="btn" onClick={onBack}>
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
