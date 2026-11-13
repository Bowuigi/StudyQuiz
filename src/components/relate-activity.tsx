import type { JSX } from 'preact';
import { useMemo } from 'preact/hooks';

import type { RelateActivity as RelateData } from '../types.d.ts';

function shuffleOptions(values: Array<string>): Array<string> {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index]!;
    shuffled[index] = shuffled[otherIndex]!;
    shuffled[otherIndex] = current;
  }

  return shuffled;
}

type RelateActivityProps = {
  activity: RelateData;
  pairs: Record<string, string>;
  confirmed: boolean;
  onSelect: (key: string, value: string) => void;
};

export function RelateActivity({
  activity,
  pairs,
  confirmed,
  onSelect,
}: RelateActivityProps): JSX.Element {
  const keys = Object.keys(activity.related);
  const values = [...new Set(Object.values(activity.related))];

  const optionsByKey = useMemo(
    () => Object.fromEntries(keys.map(key => [key, shuffleOptions(values)])),
    [activity.related],
  );

  function renderRow(key: string): JSX.Element {
    const correctValue = activity.related[key];
    const isCorrect = confirmed ? pairs[key] === correctValue : null;
    const outlineClass =
      isCorrect === true ? 'outline-2 outline-success' : 'outline-2 outline-error';

    return (
      <label key={key} class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <div class="flex flex-col gap-1">
          <span class="min-w-32 font-medium">{key}</span>
          {confirmed && <span class="text-xs text-base-content/60">Correcto: {correctValue}</span>}
        </div>
        <select
          class={`select ${confirmed ? outlineClass : ''}`}
          aria-label={key}
          value={pairs[key] ?? ''}
          disabled={confirmed}
          onChange={event => {
            onSelect(key, event.currentTarget.value);
          }}>
          <option value="">Selecciona</option>
          {optionsByKey[key]?.map(optionValue => (
            <option key={optionValue} value={optionValue}>
              {optionValue}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div class="flex flex-col gap-4">
      <h2 class="text-xl font-bold">{activity.title}</h2>
      <div class="flex flex-col gap-3">{keys.map(key => renderRow(key))}</div>
    </div>
  );
}
