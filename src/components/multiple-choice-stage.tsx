import type { JSX } from 'preact';
import { useState } from 'preact/hooks';

import { type QuizAnswer, gradeAnswer, type QuizItem } from '../quiz.ts';
import type { MultipleChoiceActivity as MultipleChoiceData } from '../types.d.ts';
import { MultipleChoiceActivity } from './multiple-choice-activity.tsx';
import type { QuizResult } from './quiz-result.ts';
import { StageActions } from './stage-actions.tsx';

interface MultipleChoiceStageProps {
  item: QuizItem;
  activity: MultipleChoiceData;
  optionOrder: Array<number>;
  onResult: (result: QuizResult) => void;
  onNext: () => void;
}

export function MultipleChoiceStage({
  item,
  activity,
  optionOrder,
  onResult,
  onNext,
}: MultipleChoiceStageProps): JSX.Element {
  const [selected, setSelected] = useState<Array<number>>([]);
  const [confirmed, setConfirmed] = useState(false);

  function toggle(optionIndex: number): void {
    if (confirmed) return;

    setSelected(current =>
      current.includes(optionIndex)
        ? current.filter(value => value !== optionIndex)
        : [...current, optionIndex],
    );
  }

  function confirm(): void {
    if (confirmed) return;

    const answer: QuizAnswer = { is: 'multiple-choice', selected };
    const grade = gradeAnswer(item, answer);
    setConfirmed(true);
    onResult({ item, answer, correct: grade.correct });
  }

  return (
    <div class="flex flex-col gap-6">
      <MultipleChoiceActivity
        activity={activity}
        optionOrder={optionOrder}
        selected={selected}
        confirmed={confirmed}
        onToggle={toggle}
      />
      <StageActions confirmed={confirmed} onNext={onNext} onConfirm={confirm} />
    </div>
  );
}
