import { useEffect, useState } from 'preact/hooks';

import { getStats, type StatsRecord } from './storage.ts';

export interface LoadedStats {
  records: Array<StatsRecord>;
  loading: boolean;
  loadError: string | null;
  setRecords: (records: Array<StatsRecord>) => void;
}

export function useLoadedStats(): LoadedStats {
  const [records, setRecords] = useState<Array<StatsRecord>>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getStats()
      .then(storedRecords => {
        if (active) setRecords(storedRecords);
      })
      .catch(() => {
        if (active) setLoadError('No se pudieron cargar las estadísticas.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { records, loading, loadError, setRecords };
}
