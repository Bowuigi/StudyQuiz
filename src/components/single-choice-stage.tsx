import type { JSX } from 'preact';
import { useState } from 'preact/hooks';

import { type QuizAnswer, gradeAnswer, type QuizItem } from '../quiz.ts';
import type { SingleChoiceActivity as SingleChoiceData } from '../types.d.ts';
import type { QuizResult } from './quiz-result.ts';
import { SingleChoiceActivity } from './single-choice-activity.tsx';
import { StageActions } from './stage-actions.tsx';

interface SingleChoiceStageProps {
  item: QuizItem;
  activity: SingleChoiceData;
  optionOrder: Array<number>;
  onResult: (result: QuizResult) => void;
  onNext: () => void;
}

export function SingleChoiceStage({
  item,
  activity,
  optionOrder,
  onResult,
  onNext,
}: SingleChoiceStageProps): JSX.Element {
  const [selected, setSelected] = useState<Array<number>>([]);
  const [confirmed, setConfirmed] = useState(false);

  function confirm(optionIndex: number): void {
    if (confirmed) return;

    const answer: QuizAnswer = { is: 'single-choice', selected: optionIndex };
    const grade = gradeAnswer(item, answer);
    setSelected([optionIndex]);
    setConfirmed(true);
    onResult({ item, answer, correct: grade.correct });
  }

  return (
    <div class="flex flex-col gap-6">
      <SingleChoiceActivity
        activity={activity}
        optionOrder={optionOrder}
        selected={selected}
        confirmed={confirmed}
        onSelect={confirm}
      />
      <StageActions confirmed={confirmed} onNext={onNext} />
    </div>
  );
}
