import type { JSX } from 'preact';
import { useState } from 'preact/hooks';

import { type QuizAnswer, gradeAnswer, type QuizItem } from '../quiz.ts';
import type { RelateActivity as RelateData } from '../types.d.ts';
import { ActivityFeedback } from './activity-feedback.tsx';
import type { QuizResult } from './quiz-result.ts';
import { RelateActivity } from './relate-activity.tsx';
import { StageActions } from './stage-actions.tsx';

interface RelateStageProps {
  item: QuizItem;
  activity: RelateData;
  onResult: (result: QuizResult) => void;
  onNext: () => void;
}

export function RelateStage({ item, activity, onResult, onNext }: RelateStageProps): JSX.Element {
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [correct, setCorrect] = useState(false);

  function select(key: string, value: string): void {
    if (confirmed) return;

    setPairs(current => ({ ...current, [key]: value }));
  }

  function confirm(): void {
    if (confirmed) return;

    const answer: QuizAnswer = { is: 'relate', pairs };
    const grade = gradeAnswer(item, answer);
    setCorrect(grade.correct);
    setConfirmed(true);
    onResult({ item, answer, correct: grade.correct });
  }

  return (
    <div class="flex flex-col gap-6">
      <RelateActivity activity={activity} pairs={pairs} confirmed={confirmed} onSelect={select} />
      {confirmed ? <ActivityFeedback item={item} correct={correct} /> : null}
      <StageActions confirmed={confirmed} onNext={onNext} onConfirm={confirm} />
    </div>
  );
}
