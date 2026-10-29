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
      <div class="flex flex-col gap-2">
        {optionOrder.map(optionIndex => {
          const option = activity.options[optionIndex];
          if (option === undefined) return null;

          return (
            <label key={optionIndex} class="label cursor-pointer justify-start gap-3">
              <input
                type="radio"
                name="single-choice"
                class="radio"
                checked={selected.includes(optionIndex)}
                disabled={confirmed}
                onChange={() => {
                  onSelect(optionIndex);
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
