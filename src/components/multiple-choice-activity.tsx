import type { JSX } from 'preact';

import type { MultipleChoiceActivity as MultipleChoiceData } from '../types.d.ts';

interface MultipleChoiceActivityProps {
  activity: MultipleChoiceData;
  optionOrder: Array<number>;
  selected: Array<number>;
  confirmed: boolean;
  onToggle: (optionIndex: number) => void;
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
      <div class="flex flex-col gap-2">
        {optionOrder.map(optionIndex => {
          const option = activity.options[optionIndex];
          if (option === undefined) return null;

          return (
            <label key={optionIndex} class="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                class="checkbox"
                checked={selected.includes(optionIndex)}
                disabled={confirmed}
                onChange={() => {
                  onToggle(optionIndex);
                }}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
