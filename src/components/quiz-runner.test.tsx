import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi, type Mock } from 'vitest';

import type { QuizItem } from '../quiz.ts';
import type { QuizResult } from './quiz-result.ts';
import { QuizRunner } from './quiz-runner.tsx';

function resultSpy(): Mock<(result: QuizResult) => void> {
  return vi.fn<(result: QuizResult) => void>();
}

function finishedSpy(): Mock<(results: Array<QuizResult>) => void> {
  return vi.fn<(results: Array<QuizResult>) => void>();
}

const singleChoice: QuizItem = {
  topicId: 'demo/tema',
  topicName: 'tema',
  optionOrder: [0, 1],
  activity: {
    is: 'single-choice',
    question: '¿Cuál es la capital de Italia?',
    options: [
      { label: 'Roma', explanation: 'Roma es la capital.' },
      { label: 'París', explanation: 'París no es la capital.' },
    ],
  },
};

const multipleChoice: QuizItem = {
  topicId: 'demo/tema',
  topicName: 'tema',
  optionOrder: [0, 1, 2],
  activity: {
    is: 'multiple-choice',
    question: '¿Cuáles son pares?',
    options: [
      { label: '2', isCorrect: true, explanation: '2 es par.' },
      { label: '3', isCorrect: false, explanation: '3 es impar.' },
      { label: '8', isCorrect: true, explanation: '8 es par.' },
    ],
  },
};

const card: QuizItem = {
  topicId: 'demo/tema',
  topicName: 'tema',
  optionOrder: [],
  activity: {
    is: 'card',
    front: 'Frente',
    back: 'Dorso',
  },
};

describe('single choice', () => {
  it('confirms with one click and shows every explanation', () => {
    const onResult = resultSpy();
    render(<QuizRunner quiz={[singleChoice]} onResult={onResult} onFinished={finishedSpy()} />);

    expect(screen.queryByText('Roma: Roma es la capital.')).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: 'Roma' }));

    expect(screen.getByText('Roma: Roma es la capital.')).toBeDefined();
    expect(screen.getByText('París: París no es la capital.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDefined();
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it('disables the options after confirmation', () => {
    render(<QuizRunner quiz={[singleChoice]} onResult={resultSpy()} onFinished={finishedSpy()} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Roma' }));

    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'Roma' }).disabled).toBe(true);
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'París' }).disabled).toBe(true);
  });
});

describe('multiple choice', () => {
  it('needs Confirmar before it shows explanations', () => {
    render(
      <QuizRunner quiz={[multipleChoice]} onResult={resultSpy()} onFinished={finishedSpy()} />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: '2' }));
    fireEvent.click(screen.getByRole('checkbox', { name: '8' }));

    expect(screen.queryByText('2: 2 es par.')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Siguiente' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(screen.getByText('2: 2 es par.')).toBeDefined();
    expect(screen.getByText('3: 3 es impar.')).toBeDefined();
    expect(screen.getByText('8: 8 es par.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDefined();
    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: '2' }).disabled).toBe(true);
  });
});

describe('result callbacks', () => {
  it('reports a correct answer', () => {
    const onResult = resultSpy();
    render(<QuizRunner quiz={[singleChoice]} onResult={onResult} onFinished={finishedSpy()} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Roma' }));

    expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining({ correct: true }));
  });

  it('reports a wrong answer', () => {
    const onResult = resultSpy();
    render(<QuizRunner quiz={[singleChoice]} onResult={onResult} onFinished={finishedSpy()} />);

    fireEvent.click(screen.getByRole('radio', { name: 'París' }));

    expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining({ correct: false }));
  });
});

describe('quiz navigation', () => {
  it('advances the progress indicator with Siguiente', () => {
    render(
      <QuizRunner quiz={[singleChoice, card]} onResult={resultSpy()} onFinished={finishedSpy()} />,
    );

    expect(screen.getByText('1 de 2')).toBeDefined();

    fireEvent.click(screen.getByRole('radio', { name: 'Roma' }));
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(screen.getByText('2 de 2')).toBeDefined();
    expect(screen.getByText('Frente')).toBeDefined();
  });

  it('calls onFinished with one result per activity on the last activity', () => {
    const onResult = resultSpy();
    const onFinished = finishedSpy();
    render(
      <QuizRunner
        quiz={[singleChoice, singleChoice]}
        onResult={onResult}
        onFinished={onFinished}
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Roma' }));
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Roma' }));
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(onResult).toHaveBeenCalledTimes(2);
    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(onFinished.mock.calls[0]?.[0]).toHaveLength(2);
  });
});

describe('cards', () => {
  it('shows the front, flips to the back, and grades as known', () => {
    const onResult = resultSpy();
    render(<QuizRunner quiz={[card]} onResult={onResult} onFinished={finishedSpy()} />);

    expect(screen.getByText('Frente')).toBeDefined();
    expect(screen.queryByText('Dorso')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar respuesta' }));

    expect(screen.getByText('Dorso')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Lo sé' }));

    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ correct: true, answer: { is: 'card', known: true } }),
    );
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDefined();
  });

  it('grades as forgotten with Me olvidé', () => {
    const onResult = resultSpy();
    render(<QuizRunner quiz={[card]} onResult={onResult} onFinished={finishedSpy()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar respuesta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Me olvidé' }));

    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ correct: false, answer: { is: 'card', known: false } }),
    );
  });
});
