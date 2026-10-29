import type { JSX } from 'preact';

import type { QuizItem } from '../quiz.ts';
import { CardStage } from './card-stage.tsx';
import { MultipleChoiceStage } from './multiple-choice-stage.tsx';
import type { QuizResult } from './quiz-result.ts';
import { SingleChoiceStage } from './single-choice-stage.tsx';

interface ActivityStageProps {
  item: QuizItem;
  onResult: (result: QuizResult) => void;
  onNext: () => void;
}

function UnsupportedActivity(): JSX.Element {
  return (
    <div class="alert">
      <span>Este tipo de actividad aún no está disponible.</span>
    </div>
  );
}

export function ActivityStage({ item, onResult, onNext }: ActivityStageProps): JSX.Element {
  const { activity } = item;

  switch (activity.is) {
    case 'single-choice': {
      return (
        <SingleChoiceStage
          item={item}
          activity={activity}
          optionOrder={item.optionOrder}
          onResult={onResult}
          onNext={onNext}
        />
      );
    }

    case 'multiple-choice': {
      return (
        <MultipleChoiceStage
          item={item}
          activity={activity}
          optionOrder={item.optionOrder}
          onResult={onResult}
          onNext={onNext}
        />
      );
    }

    case 'card': {
      return <CardStage item={item} activity={activity} onResult={onResult} onNext={onNext} />;
    }

    case 'reorder':
    case 'relate':
    case 'complete-words': {
      return <UnsupportedActivity />;
    }
  }
}
