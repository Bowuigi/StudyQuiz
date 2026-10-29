import type { JSX } from 'preact';

import type { RelateActivity as RelateData } from '../types.d.ts';

interface RelateActivityProps {
  activity: RelateData;
  pairs: Record<string, string>;
  confirmed: boolean;
  onSelect: (key: string, value: string) => void;
}

export function RelateActivity({
  activity,
  pairs,
  confirmed,
  onSelect,
}: RelateActivityProps): JSX.Element {
  const keys = Object.keys(activity.related);
  const values = [...new Set(Object.values(activity.related))];

  return (
    <div class="flex flex-col gap-4">
      <h2 class="text-xl font-bold">{activity.title}</h2>
      <div class="flex flex-col gap-3">
        {keys.map(key => (
          <label key={key} class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span class="min-w-32 font-medium">{key}</span>
            <select
              class="select"
              aria-label={key}
              value={pairs[key] ?? ''}
              disabled={confirmed}
              onChange={event => {
                onSelect(key, event.currentTarget.value);
              }}>
              <option value="">Selecciona</option>
              {values.map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}
