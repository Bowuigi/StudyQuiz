import type { JSX } from 'preact';

import type { CompleteWordsActivity as CompleteWordsData } from '../types.d.ts';

interface CompleteWordsActivityProps {
  activity: CompleteWordsData;
  blanks: Array<string>;
  confirmed: boolean;
  onChange: (index: number, value: string) => void;
}

export function CompleteWordsActivity({
  activity,
  blanks,
  confirmed,
  onChange,
}: CompleteWordsActivityProps): JSX.Element {
  let blankIndex = 0;

  return (
    <div class="flex flex-col gap-4">
      <h2 class="text-sm tracking-wide text-base-content/60 uppercase">Completa las palabras</h2>
      <div class="flex flex-wrap items-center gap-1 text-lg leading-relaxed">
        {activity.parts.map((part, partIndex) => {
          if (!part.isBlank) {
            return <span key={partIndex}>{part.label}</span>;
          }

          const index = blankIndex;
          blankIndex += 1;

          return (
            <input
              key={partIndex}
              type="text"
              class="input input-bordered input-sm mx-1 w-40"
              aria-label={`Hueco ${index + 1}`}
              value={blanks[index] ?? ''}
              disabled={confirmed}
              onInput={event => {
                onChange(index, event.currentTarget.value);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
