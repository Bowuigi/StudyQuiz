import type { JSX } from 'preact';
import { useState } from 'preact/hooks';

import { type QuizAnswer, gradeAnswer, type QuizItem } from '../quiz.ts';
import type { ReorderActivity as ReorderData } from '../types.d.ts';
import { ActivityFeedback } from './activity-feedback.tsx';
import type { QuizResult } from './quiz-result.ts';
import { ReorderActivity } from './reorder-activity.tsx';
import { StageActions } from './stage-actions.tsx';

interface ReorderStageProps {
  item: QuizItem;
  activity: ReorderData;
  optionOrder: Array<number>;
  onResult: (result: QuizResult) => void;
  onNext: () => void;
}

function initialOrder(optionOrder: Array<number>, length: number): Array<number> {
  if (optionOrder.length === length) {
    return [...optionOrder];
  }

  return Array.from({ length }, (_, index) => index);
}

function moveOrder(order: Array<number>, from: number, to: number): Array<number> {
  const next = [...order];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return order;

  next.splice(to, 0, moved);
  return next;
}

export function ReorderStage({
  item,
  activity,
  optionOrder,
  onResult,
  onNext,
}: ReorderStageProps): JSX.Element {
  const [order, setOrder] = useState<Array<number>>(() =>
    initialOrder(optionOrder, activity.elements.length),
  );
  const [confirmed, setConfirmed] = useState(false);
  const [correct, setCorrect] = useState(false);

  function move(from: number, to: number): void {
    if (confirmed || from === to) return;

    setOrder(current => moveOrder(current, from, to));
  }

  function confirm(): void {
    if (confirmed) return;

    const answer: QuizAnswer = {
      is: 'reorder',
      order: order.flatMap(elementIndex => {
        const element = activity.elements[elementIndex];
        return element === undefined ? [] : [element];
      }),
    };
    const grade = gradeAnswer(item, answer);
    setCorrect(grade.correct);
    setConfirmed(true);
    onResult({ item, answer, correct: grade.correct });
  }

  return (
    <div class="flex flex-col gap-6">
      <ReorderActivity activity={activity} order={order} confirmed={confirmed} onMove={move} />
      {confirmed ? <ActivityFeedback item={item} correct={correct} /> : null}
      <StageActions confirmed={confirmed} onNext={onNext} onConfirm={confirm} />
    </div>
  );
}
