import { useState } from 'preact/hooks';

import { resetStats } from './storage.ts';
import { useLoadedStats } from './use-loaded-stats.ts';

export interface StatsRecordsState {
  records: ReturnType<typeof useLoadedStats>['records'];
  loading: boolean;
  confirmingReset: boolean;
  resetting: boolean;
  error: string | null;
  openReset: () => void;
  cancelReset: () => void;
  confirmReset: () => void;
}

export function useStatsRecords(): StatsRecordsState {
  const loaded = useLoadedStats();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  async function reset(): Promise<void> {
    setResetting(true);
    setResetError(null);

    try {
      await resetStats();
      loaded.setRecords([]);
      setConfirmingReset(false);
    } catch {
      setResetError('No se pudieron reiniciar las estadísticas.');
    } finally {
      setResetting(false);
    }
  }

  function confirmReset(): void {
    reset().catch(() => null);
  }

  function openReset(): void {
    setConfirmingReset(true);
  }

  function cancelReset(): void {
    setConfirmingReset(false);
  }

  return {
    records: loaded.records,
    loading: loaded.loading,
    confirmingReset,
    resetting,
    error: loaded.loadError ?? resetError,
    openReset,
    cancelReset,
    confirmReset,
  };
}
