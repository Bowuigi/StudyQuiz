import type { JSX } from 'preact';
import { useRef, useState } from 'preact/hooks';

import { formatDisplayName } from '../format.ts';
import type { QuizItem } from '../quiz.ts';
import { ActivityStage } from './activity-stage.tsx';
import type { QuizResult } from './quiz-result.ts';

export type { QuizResult } from './quiz-result.ts';

type QuizRunnerProps = {
  quiz: Array<QuizItem>;
  onResult: (result: QuizResult) => void;
  onFinished: (results: Array<QuizResult>) => void;
};

export function QuizRunner({ quiz, onResult, onFinished }: QuizRunnerProps): JSX.Element {
  const [index, setIndex] = useState(0);
  const resultsRef = useRef<Array<QuizResult>>([]);
  const item = quiz[index];

  if (item === undefined) {
    return (
      <div class="alert">
        <span>No hay actividades.</span>
      </div>
    );
  }

  function handleResult(result: QuizResult): void {
    resultsRef.current = [...resultsRef.current, result];
    onResult(result);
  }

  function handleNext(): void {
    if (index >= quiz.length - 1) {
      onFinished(resultsRef.current);
      return;
    }

    setIndex(index + 1);
  }

  return (
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body gap-6">
        <div class="flex items-center justify-between gap-3">
          <span class="badge badge-ghost">
            {index + 1} de {quiz.length}
          </span>
          <span class="text-sm text-base-content/60">{formatDisplayName(item.topicName)}</span>
        </div>

        <ActivityStage key={index} item={item} onResult={handleResult} onNext={handleNext} />
      </div>
    </div>
  );
}
