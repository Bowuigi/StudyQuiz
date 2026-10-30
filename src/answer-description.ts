import {
  type CompleteWordsAnswer,
  type MultipleChoiceAnswer,
  type QuizAnswer,
  type QuizItem,
  type RelateAnswer,
  type SingleChoiceAnswer,
  optionExplanations,
} from './quiz.ts';
import type {
  CompleteWordsActivity,
  MultipleChoiceActivity,
  QuizActivity,
  RelateActivity,
  SingleChoiceActivity,
} from './types.d.ts';

export function activityTitle(activity: QuizActivity): string {
  switch (activity.is) {
    case 'single-choice':
    case 'multiple-choice': {
      return activity.question;
    }

    case 'reorder':
    case 'relate': {
      return activity.title;
    }

    case 'complete-words': {
      return 'Completa las palabras';
    }

    case 'card': {
      return activity.front;
    }

    default: {
      return 'Actividad';
    }
  }
}

function singleChoiceLines(
  activity: SingleChoiceActivity,
  answer: SingleChoiceAnswer,
): Array<string> {
  return [activity.options[answer.selected]?.label ?? 'Sin respuesta'];
}

function multipleChoiceLines(
  activity: MultipleChoiceActivity,
  answer: MultipleChoiceAnswer,
): Array<string> {
  const labels = answer.selected.flatMap(index => {
    const option = activity.options[index];
    return option === undefined ? [] : [option.label];
  });
  return labels.length > 0 ? labels : ['Sin respuesta'];
}

function relateLines(activity: RelateActivity, answer: RelateAnswer): Array<string> {
  return Object.keys(activity.related).map(
    key => `${key}: ${answer.pairs[key] ?? 'Sin respuesta'}`,
  );
}

function completeWordsLines(
  activity: CompleteWordsActivity,
  answer: CompleteWordsAnswer,
): Array<string> {
  let blankIndex = 0;
  const text = activity.parts
    .map(part => {
      if (!part.isBlank) return part.label;

      const value = answer.blanks[blankIndex] ?? '';
      blankIndex += 1;
      return value;
    })
    .join(' ');
  return [text.length > 0 ? text : 'Sin respuesta'];
}

export function userAnswerLines(item: QuizItem, answer: QuizAnswer): Array<string> {
  const { activity } = item;

  switch (answer.is) {
    case 'single-choice': {
      return activity.is === 'single-choice'
        ? singleChoiceLines(activity, answer)
        : ['Sin respuesta'];
    }

    case 'multiple-choice': {
      return activity.is === 'multiple-choice'
        ? multipleChoiceLines(activity, answer)
        : ['Sin respuesta'];
    }

    case 'reorder': {
      return answer.order.map((element, index) => `${index + 1}. ${element}`);
    }

    case 'relate': {
      return activity.is === 'relate' ? relateLines(activity, answer) : ['Sin respuesta'];
    }

    case 'complete-words': {
      return activity.is === 'complete-words'
        ? completeWordsLines(activity, answer)
        : ['Sin respuesta'];
    }

    case 'card': {
      return [answer.known ? 'Lo sé' : 'Me olvidé'];
    }

    default: {
      return ['Sin respuesta'];
    }
  }
}

export function summaryExplanationLines(item: QuizItem): Array<string> {
  const { activity } = item;

  switch (activity.is) {
    case 'single-choice':
    case 'multiple-choice': {
      return optionExplanations(item);
    }

    case 'card': {
      return [activity.back];
    }

    case 'reorder': {
      return ['El orden debe coincidir con el orden original de los elementos.'];
    }

    case 'relate': {
      return ['Cada elemento debe relacionarse con su valor correcto.'];
    }

    case 'complete-words': {
      return ['La respuesta se compara sin distinguir mayúsculas, tildes ni espacios.'];
    }

    default: {
      return [];
    }
  }
}
