import { useReducer, useRef, useState } from 'preact/hooks';

import type { QuizResult } from './components/quiz-result.ts';
import type { Subject } from './content.ts';
import { type BuildQuizOptions, buildQuiz, type QuizItem } from './quiz.ts';
import { recordResult as saveResult } from './storage.ts';

interface SessionState {
  quiz: Array<QuizItem>;
  results: Array<QuizResult>;
  startedAt: number | null;
  finishedAt: number | null;
}

type SessionAction =
  | { type: 'start'; quiz: Array<QuizItem>; startedAt: number | null }
  | { type: 'result'; result: QuizResult; finishedAt: number | null }
  | { type: 'finish'; results: Array<QuizResult> }
  | { type: 'reset' };

const initialState: SessionState = {
  quiz: [],
  results: [],
  startedAt: null,
  finishedAt: null,
};

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'start': {
      return {
        quiz: action.quiz,
        results: [],
        startedAt: action.startedAt,
        finishedAt: null,
      };
    }

    case 'result': {
      return {
        ...state,
        results: [...state.results, action.result],
        finishedAt: action.finishedAt,
      };
    }

    case 'finish': {
      return { ...state, results: action.results };
    }

    case 'reset': {
      return initialState;
    }

    default: {
      return state;
    }
  }
}

function findSubjectName(subjects: Array<Subject>, result: QuizResult): string {
  const matchingSubject = subjects.find(candidate =>
    candidate.topics.some(topic => topic.id === result.item.topicId),
  );
  return matchingSubject?.name ?? result.item.topicId.split('/')[0] ?? result.item.topicName;
}

async function persistResult(subjects: Array<Subject>, result: QuizResult): Promise<void> {
  await saveResult({
    topicId: result.item.topicId,
    subject: findSubjectName(subjects, result),
    topic: result.item.topicName,
    type: result.item.activity.is,
    correct: result.correct,
  });
}

export interface QuizSession {
  quiz: Array<QuizItem>;
  results: Array<QuizResult>;
  elapsedSeconds: number;
  storageError: string | null;
  startQuiz: (options: BuildQuizOptions) => void;
  recordResult: (result: QuizResult) => void;
  finishQuiz: (results: Array<QuizResult>) => void;
  reset: () => void;
}

export function useQuizSession(subjects: Array<Subject>, now: () => number): QuizSession {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const [storageError, setStorageError] = useState<string | null>(null);
  const resultCount = useRef(0);

  function startQuiz(options: BuildQuizOptions): void {
    const quiz = buildQuiz(subjects, options);
    resultCount.current = 0;
    setStorageError(null);
    dispatch({ type: 'start', quiz, startedAt: quiz.length > 0 ? now() : null });
  }

  function recordResult(result: QuizResult): void {
    resultCount.current += 1;
    const finishedAt = resultCount.current === state.quiz.length ? now() : null;
    dispatch({ type: 'result', result, finishedAt });

    persistResult(subjects, result).catch(() => {
      setStorageError('No se pudo guardar el resultado.');
    });
  }

  function finishQuiz(results: Array<QuizResult>): void {
    dispatch({ type: 'finish', results });
  }

  function reset(): void {
    resultCount.current = 0;
    dispatch({ type: 'reset' });
  }

  const end = state.finishedAt ?? now();
  const elapsedSeconds =
    state.startedAt === null ? 0 : Math.max(0, Math.floor((end - state.startedAt) / 1000));

  return {
    quiz: state.quiz,
    results: state.results,
    elapsedSeconds,
    storageError,
    startQuiz,
    recordResult,
    finishQuiz,
    reset,
  };
}
