import type { JSX } from 'preact';

import type { CompleteWordsActivity as CompleteWordsData } from '../types.d.ts';

type CompleteWordsActivityProps = {
  activity: CompleteWordsData;
  blanks: Array<string>;
  confirmed: boolean;
  correctness: Array<boolean | null>;
  onChange: (index: number, value: string) => void;
};

function renderBlank({
  index,
  value,
  part,
  confirmed,
  correctness,
  onChange,
}: {
  index: number;
  value: string | undefined;
  part: CompleteWordsData['parts'][number];
  confirmed: boolean;
  correctness: Array<boolean | null>;
  onChange: (index: number, value: string) => void;
}): JSX.Element {
  const status = confirmed ? correctness[index] : null;
  let inputClass = 'input input-bordered input-sm mx-1 w-40';
  if (status === true) {
    inputClass += ' input-success bg-success';
  } else if (status === false) {
    inputClass += ' input-error bg-error';
  }

  const input = (
    <input
      type="text"
      class={inputClass}
      aria-label={`Hueco ${index + 1}`}
      value={value ?? ''}
      disabled={confirmed}
      onInput={event => {
        onChange(index, event.currentTarget.value);
      }}
    />
  );

  if (status === false) {
    return (
      <div class="tooltip" data-tip={part.label}>
        {input}
      </div>
    );
  }

  return input;
}

export function CompleteWordsActivity({
  activity,
  blanks,
  confirmed,
  correctness,
  onChange,
}: CompleteWordsActivityProps): JSX.Element {
  let blankIndex = 0;

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center gap-1 text-lg leading-relaxed">
        {activity.parts.map((part, partIndex) => {
          if (!part.isBlank) {
            return <span key={partIndex}>{part.label}</span>;
          }

          const element = renderBlank({
            index: blankIndex,
            value: blanks[blankIndex],
            part,
            confirmed,
            correctness,
            onChange,
          });
          blankIndex += 1;
          return <span key={partIndex}>{element}</span>;
        })}
      </div>
    </div>
  );
}
