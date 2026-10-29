import type { JSX } from 'preact';
import { useState } from 'preact/hooks';

import { type QuizAnswer, gradeAnswer, type QuizItem } from '../quiz.ts';
import type { CardActivity as CardData } from '../types.d.ts';
import { CardActivity } from './card-activity.tsx';
import type { QuizResult } from './quiz-result.ts';
import { StageActions } from './stage-actions.tsx';

interface CardStageProps {
  item: QuizItem;
  activity: CardData;
  onResult: (result: QuizResult) => void;
  onNext: () => void;
}

export function CardStage({ item, activity, onResult, onNext }: CardStageProps): JSX.Element {
  const [revealed, setRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  function grade(known: boolean): void {
    if (confirmed) return;

    const answer: QuizAnswer = { is: 'card', known };
    const gradeResult = gradeAnswer(item, answer);
    setConfirmed(true);
    onResult({ item, answer, correct: gradeResult.correct });
  }

  return (
    <div class="flex flex-col gap-6">
      <CardActivity
        activity={activity}
        revealed={revealed}
        confirmed={confirmed}
        onReveal={() => {
          setRevealed(true);
        }}
        onGrade={grade}
      />
      <StageActions confirmed={confirmed} onNext={onNext} />
    </div>
  );
}
