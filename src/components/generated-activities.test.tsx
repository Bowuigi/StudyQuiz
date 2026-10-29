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

const reorder: QuizItem = {
  topicId: 'demo/tema',
  topicName: 'tema',
  optionOrder: [1, 2, 0],
  activity: {
    is: 'reorder',
    title: 'Ordena los números',
    elements: ['Uno', 'Dos', 'Tres'],
  },
};

const relate: QuizItem = {
  topicId: 'demo/tema',
  topicName: 'tema',
  optionOrder: [],
  activity: {
    is: 'relate',
    title: 'Relaciona letras y números',
    related: { a: '1', b: '2' },
  },
};

const completeWords: QuizItem = {
  topicId: 'demo/tema',
  topicName: 'tema',
  optionOrder: [],
  activity: {
    is: 'complete-words',
    parts: [
      { isBlank: false, label: 'El ' },
      { isBlank: true, label: 'Camión' },
      { isBlank: false, label: ' es grande.' },
    ],
  },
};

function visibleOrder(): Array<string> {
  return screen.getAllByTestId('reorder-item').map(node => node.textContent);
}

describe('reorder', () => {
  it('changes the display order after a drag event sequence', () => {
    render(<QuizRunner quiz={[reorder]} onResult={resultSpy()} onFinished={finishedSpy()} />);

    expect(visibleOrder()).toEqual(['Dos', 'Tres', 'Uno']);

    const [first, , third] = screen.getAllByTestId('reorder-item');
    fireEvent.dragStart(first!);
    fireEvent.dragOver(third!);
    fireEvent.drop(third!);

    expect(visibleOrder()).toEqual(['Tres', 'Uno', 'Dos']);
  });

  it('grades a correct order and shows the correct-answer panel', () => {
    const onResult = resultSpy();
    render(<QuizRunner quiz={[reorder]} onResult={onResult} onFinished={finishedSpy()} />);

    const items = screen.getAllByTestId('reorder-item');
    fireEvent.dragStart(items[2]!);
    fireEvent.dragOver(items[0]!);
    fireEvent.drop(items[0]!);

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining({ correct: true }));
    expect(screen.getByText('1. Uno')).toBeDefined();
    expect(screen.getByText('2. Dos')).toBeDefined();
    expect(screen.getByText('3. Tres')).toBeDefined();
  });

  it('grades a wrong order and still shows the correct-answer panel', () => {
    const onResult = resultSpy();
    render(<QuizRunner quiz={[reorder]} onResult={onResult} onFinished={finishedSpy()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining({ correct: false }));
    expect(screen.getByText('1. Uno')).toBeDefined();
  });
});

describe('relate', () => {
  it('updates the answer on dropdown change and grades it', () => {
    const onResult = resultSpy();
    render(<QuizRunner quiz={[relate]} onResult={onResult} onFinished={finishedSpy()} />);

    fireEvent.change(screen.getByRole('combobox', { name: 'a' }), { target: { value: '1' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'b' }), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onResult).toHaveBeenLastCalledWith(
      expect.objectContaining({
        correct: true,
        answer: { is: 'relate', pairs: { a: '1', b: '2' } },
      }),
    );
    expect(screen.getByText('a: 1')).toBeDefined();
    expect(screen.getByText('b: 2')).toBeDefined();
  });

  it('grades a wrong pair as incorrect', () => {
    const onResult = resultSpy();
    render(<QuizRunner quiz={[relate]} onResult={onResult} onFinished={finishedSpy()} />);

    fireEvent.change(screen.getByRole('combobox', { name: 'a' }), { target: { value: '2' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'b' }), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining({ correct: false }));
    expect(screen.getByText('a: 1')).toBeDefined();
    expect(screen.getByText('b: 2')).toBeDefined();
  });
});

describe('complete words', () => {
  it('grades an answer with different case and accents as correct', () => {
    const onResult = resultSpy();
    render(<QuizRunner quiz={[completeWords]} onResult={onResult} onFinished={finishedSpy()} />);

    fireEvent.input(screen.getByRole('textbox', { name: 'Hueco 1' }), {
      target: { value: '  camion ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining({ correct: true }));
    expect(screen.getByText('El Camión es grande.')).toBeDefined();
  });

  it('grades a wrong answer as incorrect and disables the input', () => {
    const onResult = resultSpy();
    render(<QuizRunner quiz={[completeWords]} onResult={onResult} onFinished={finishedSpy()} />);

    fireEvent.input(screen.getByRole('textbox', { name: 'Hueco 1' }), {
      target: { value: 'casa' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining({ correct: false }));
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Hueco 1' }).disabled).toBe(true);
    expect(screen.getByText('El Camión es grande.')).toBeDefined();
  });
});
