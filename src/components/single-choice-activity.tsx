import type { JSX } from 'preact';

import type { SingleChoiceActivity as SingleChoiceData } from '../types.d.ts';

interface SingleChoiceActivityProps {
  activity: SingleChoiceData;
  optionOrder: Array<number>;
  selected: Array<number>;
  confirmed: boolean;
  onSelect: (optionIndex: number) => void;
}

export function SingleChoiceActivity({
  activity,
  optionOrder,
  selected,
  confirmed,
  onSelect,
}: SingleChoiceActivityProps): JSX.Element {
  return (
    <div class="flex flex-col gap-4">
      <h2 class="text-xl font-bold">{activity.question}</h2>
      <div class="flex flex-col gap-3">
        {optionOrder.map((optionIndex, i) => {
          const option = activity.options[optionIndex];
          if (!option) return null;
          const isSelected = selected.includes(optionIndex);
          const isCorrect = optionIndex === 0;
          const letter = String.fromCodePoint(65 + i);
          let borderClass = 'border-base-300';
          if (confirmed) {
            if (isCorrect) borderClass = 'border-success';
            else if (isSelected) borderClass = 'border-error';
          }
          return (
            <label
              key={optionIndex}
              class={`card bg-base-200 border ${borderClass} cursor-pointer hover:bg-base-200/80 transition-colors`}>
              <div class="card-body p-4">
                <div class="flex items-start gap-3">
                  <input
                    type="radio"
                    name="single-choice"
                    class="radio mt-1"
                    checked={isSelected}
                    disabled={confirmed}
                    onChange={() => {
                      onSelect(optionIndex);
                    }}
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline gap-2">
                      <span aria-hidden="true" class="font-mono text-sm text-base-content/60">
                        {letter}.
                      </span>
                      <span class="font-medium">{option.label}</span>
                    </div>
                    {confirmed && (
                      <div aria-hidden="true" class="text-sm text-base-content/70 mt-2">
                        {option.label}: {option.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
