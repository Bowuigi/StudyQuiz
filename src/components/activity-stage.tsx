import type { JSX } from 'preact';

import type { QuizItem } from '../quiz.ts';
import { CardStage } from './card-stage.tsx';
import { CompleteWordsStage } from './complete-words-stage.tsx';
import { MultipleChoiceStage } from './multiple-choice-stage.tsx';
import type { QuizResult } from './quiz-result.ts';
import { RelateStage } from './relate-stage.tsx';
import { ReorderStage } from './reorder-stage.tsx';
import { SingleChoiceStage } from './single-choice-stage.tsx';

interface ActivityStageProps {
  item: QuizItem;
  onResult: (result: QuizResult) => void;
  onNext: () => void;
}

function ChoiceStage({ item, onResult, onNext }: ActivityStageProps): JSX.Element {
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
      return <div class="alert">Tipo de actividad desconocido.</div>;
    }
  }
}

function GeneratedStage({ item, onResult, onNext }: ActivityStageProps): JSX.Element {
  const { activity } = item;

  switch (activity.is) {
    case 'reorder': {
      return (
        <ReorderStage
          item={item}
          activity={activity}
          optionOrder={item.optionOrder}
          onResult={onResult}
          onNext={onNext}
        />
      );
    }

    case 'relate': {
      return <RelateStage item={item} activity={activity} onResult={onResult} onNext={onNext} />;
    }

    case 'complete-words': {
      return (
        <CompleteWordsStage item={item} activity={activity} onResult={onResult} onNext={onNext} />
      );
    }

    case 'single-choice':
    case 'multiple-choice':
    case 'card': {
      return <div class="alert">Tipo de actividad desconocido.</div>;
    }
  }
}

export function ActivityStage(props: ActivityStageProps): JSX.Element {
  const { is } = props.item.activity;

  if (is === 'reorder' || is === 'relate' || is === 'complete-words') {
    return <GeneratedStage {...props} />;
  }

  return <ChoiceStage {...props} />;
}
