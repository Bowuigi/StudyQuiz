import type { JSX } from 'preact';

import type { MultipleChoiceActivity as MultipleChoiceData } from '../types.d.ts';

interface MultipleChoiceActivityProps {
  activity: MultipleChoiceData;
  optionOrder: Array<number>;
  selected: Array<number>;
  confirmed: boolean;
  onToggle: (optionIndex: number) => void;
}

function optionLetter(index: number): string {
  return String.fromCodePoint(65 + index);
}

function renderOption({
  option,
  optionIndex,
  i,
  selected,
  confirmed,
  onToggle,
}: {
  option: MultipleChoiceData['options'][number];
  optionIndex: number;
  i: number;
  selected: Array<number>;
  confirmed: boolean;
  onToggle: (optionIndex: number) => void;
}): JSX.Element {
  const isSelected = selected.includes(optionIndex);
  const { isCorrect, label, explanation } = option;
  const letter = optionLetter(i);
  let borderClass = 'border-base-300';
  let checkboxColor = '';
  if (confirmed) {
    if (isCorrect && isSelected) borderClass = 'border-success';
    else if (!isCorrect && isSelected) borderClass = 'border-error';
    else if (isCorrect && !isSelected) borderClass = 'border-warning';
    if (isSelected) checkboxColor = isCorrect ? 'checkbox-success' : 'checkbox-error';
  }
  return (
    <label
      key={optionIndex}
      class={`card bg-base-200 border ${borderClass} cursor-pointer hover:bg-base-200/80 transition-colors`}>
      <div class="card-body p-4">
        <div class="flex items-start gap-3">
          <input
            type="checkbox"
            class={`checkbox mt-1 ${checkboxColor}`}
            checked={isSelected}
            disabled={confirmed}
            onChange={() => {
              onToggle(optionIndex);
            }}
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-2">
              <span aria-hidden="true" class="font-mono text-sm text-base-content/60">
                {letter}.
              </span>
              <span class="font-medium">{label}</span>
            </div>
            {confirmed && (
              <div aria-hidden="true" class="text-sm text-base-content/70 mt-2">
                {explanation}
              </div>
            )}
          </div>
        </div>
      </div>
    </label>
  );
}

export function MultipleChoiceActivity({
  activity,
  optionOrder,
  selected,
  confirmed,
  onToggle,
}: MultipleChoiceActivityProps): JSX.Element {
  return (
    <div class="flex flex-col gap-4">
      <h2 class="text-xl font-bold">{activity.question}</h2>
      <div class="flex flex-col gap-3">
        {optionOrder.map((optionIndex, i) => {
          const option = activity.options[optionIndex];
          if (!option) return null;
          return renderOption({ option, optionIndex, i, selected, confirmed, onToggle });
        })}
      </div>
    </div>
  );
}
