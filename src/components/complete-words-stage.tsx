import type { JSX } from 'preact';
import { useState } from 'preact/hooks';

import { type QuizAnswer, gradeAnswer, normalize, type QuizItem } from '../quiz.ts';
import type { CompleteWordsActivity as CompleteWordsData } from '../types.d.ts';
import { ActivityHeader } from './activity-header.tsx';
import { CompleteWordsActivity } from './complete-words-activity.tsx';
import type { QuizResult } from './quiz-result.ts';
import { StageActions } from './stage-actions.tsx';

type CompleteWordsStageProps = {
  item: QuizItem;
  activity: CompleteWordsData;
  onResult: (result: QuizResult) => void;
  onNext: () => void;
};

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
  const [blankCorrect, setBlankCorrect] = useState<Array<boolean | null>>(() =>
    Array.from({ length: blankCount }, () => null),
  );

  function change(index: number, value: string): void {
    if (confirmed) return;

    setBlanks(current => current.map((blank, position) => (position === index ? value : blank)));
  }

  function confirm(): void {
    if (confirmed) return;

    const answer: QuizAnswer = { is: 'complete-words', blanks };
    const grade = gradeAnswer(item, answer);

    const blankParts = activity.parts.filter(part => part.isBlank);
    const marks = blankParts.map(
      (part, blankIndex) => normalize(blanks[blankIndex] ?? '') === normalize(part.label),
    );
    setBlankCorrect(marks);
    setCorrect(grade.correct);
    setConfirmed(true);
    onResult({ item, answer, correct: grade.correct });
  }

  return (
    <div class="flex flex-col gap-6">
      <ActivityHeader type={item.activity.is} status={confirmed ? correct : null} />
      <CompleteWordsActivity
        activity={activity}
        blanks={blanks}
        confirmed={confirmed}
        correctness={blankCorrect}
        onChange={change}
      />
      <StageActions confirmed={confirmed} onNext={onNext} onConfirm={confirm} />
    </div>
  );
}
