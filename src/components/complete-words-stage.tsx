import type { JSX } from 'preact';
import { useState } from 'preact/hooks';

import { type QuizAnswer, gradeAnswer, type QuizItem } from '../quiz.ts';
import type { CompleteWordsActivity as CompleteWordsData } from '../types.d.ts';
import { ActivityFeedback } from './activity-feedback.tsx';
import { CompleteWordsActivity } from './complete-words-activity.tsx';
import type { QuizResult } from './quiz-result.ts';
import { StageActions } from './stage-actions.tsx';

interface CompleteWordsStageProps {
  item: QuizItem;
  activity: CompleteWordsData;
  onResult: (result: QuizResult) => void;
  onNext: () => void;
}

export function CompleteWordsStage({
  item,
  activity,
  onResult,
  onNext,
}: CompleteWordsStageProps): JSX.Element {
  const blankCount = activity.parts.filter(part => part.isBlank).length;
  const [blanks, setBlanks] = useState<Array<string>>(() =>
    Array.from({ length: blankCount }, () => ''),
  );
  const [confirmed, setConfirmed] = useState(false);
  const [correct, setCorrect] = useState(false);

  function change(index: number, value: string): void {
    if (confirmed) return;

    setBlanks(current => current.map((blank, position) => (position === index ? value : blank)));
  }

  function confirm(): void {
    if (confirmed) return;

    const answer: QuizAnswer = { is: 'complete-words', blanks };
    const grade = gradeAnswer(item, answer);
    setCorrect(grade.correct);
    setConfirmed(true);
    onResult({ item, answer, correct: grade.correct });
  }

  return (
    <div class="flex flex-col gap-6">
      <CompleteWordsActivity
        activity={activity}
        blanks={blanks}
        confirmed={confirmed}
        onChange={change}
      />
      {confirmed ? <ActivityFeedback item={item} correct={correct} /> : null}
      <StageActions confirmed={confirmed} onNext={onNext} onConfirm={confirm} />
    </div>
  );
}
