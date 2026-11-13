import type { JSX } from 'preact';
import { useState } from 'preact/hooks';

import { type QuizAnswer, gradeAnswer, type QuizItem } from '../quiz.ts';
import type { CardActivity as CardData } from '../types.d.ts';
import { CardActivity } from './card-activity.tsx';
import type { QuizResult } from './quiz-result.ts';

interface CardStageProps {
  item: QuizItem;
  activity: CardData;
  onResult: (result: QuizResult) => void;
  onNext: () => void;
}

export function CardStage({ item, activity, onResult, onNext }: CardStageProps): JSX.Element {
  const [flipped, setFlipped] = useState(false);

  function grade(known: boolean): void {
    const answer: QuizAnswer = { is: 'card', known };
    const gradeResult = gradeAnswer(item, answer);
    onResult({ item, answer, correct: gradeResult.correct });
    onNext();
  }

  return (
    <div class="flex flex-col gap-6">
      <CardActivity
        activity={activity}
        flipped={flipped}
        onFlip={() => {
          setFlipped(true);
        }}
        onGrade={grade}
      />
    </div>
  );
}
