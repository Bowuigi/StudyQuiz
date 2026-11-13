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

function positionMarks(): Array<{ text: string; className: string }> {
  return screen.getAllByTestId('reorder-item').map(node => {
    const number = node.querySelector('span');
    return {
      text: number?.textContent ?? '',
      className: number?.getAttribute('class') ?? '',
    };
  });
}

function selectOf(key: string): HTMLElement {
  return screen.getByRole('combobox', { name: key });
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

  it('shows the correct position of each element after a correct order', () => {
    const onResult = resultSpy();
    render(<QuizRunner quiz={[reorder]} onResult={onResult} onFinished={finishedSpy()} />);

    const items = screen.getAllByTestId('reorder-item');
    fireEvent.dragStart(items[2]!);
    fireEvent.dragOver(items[0]!);
    fireEvent.drop(items[0]!);

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining({ correct: true }));
    expect(screen.getByText('Ordenar')).toBeDefined();
    expect(screen.getByText('Respuesta Correcta')).toBeDefined();

    expect(positionMarks()).toEqual([
      { text: '1', className: expect.stringContaining('text-success') },
      { text: '2', className: expect.stringContaining('text-success') },
      { text: '3', className: expect.stringContaining('text-success') },
    ]);
  });

  it('shows the correct position of each element after a wrong order', () => {
    const onResult = resultSpy();
    render(<QuizRunner quiz={[reorder]} onResult={onResult} onFinished={finishedSpy()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining({ correct: false }));
    expect(screen.getByText('Ordenar')).toBeDefined();
    expect(screen.getByText('Respuesta Incorrecta')).toBeDefined();

    expect(positionMarks()).toEqual([
      { text: '2', className: expect.stringContaining('text-error') },
      { text: '3', className: expect.stringContaining('text-error') },
      { text: '1', className: expect.stringContaining('text-error') },
    ]);
  });
});

describe('relate', () => {
  it('grades a correct pair as correct and marks both rows', () => {
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
    expect(screen.getByText('Relacionar')).toBeDefined();
    expect(screen.getByText('Respuesta Correcta')).toBeDefined();

    expect(selectOf('a').className).toContain('outline-success');
    expect(selectOf('a').className).not.toContain('outline-error');
    expect(selectOf('b').className).toContain('outline-success');
    expect(selectOf('b').className).not.toContain('outline-error');
    expect(screen.getByText('Correcto: 1')).toBeDefined();
    expect(screen.getByText('Correcto: 2')).toBeDefined();
  });

  it('grades a wrong pair as incorrect and marks both rows', () => {
    const onResult = resultSpy();
    render(<QuizRunner quiz={[relate]} onResult={onResult} onFinished={finishedSpy()} />);

    fireEvent.change(screen.getByRole('combobox', { name: 'a' }), { target: { value: '2' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'b' }), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining({ correct: false }));
    expect(screen.getByText('Relacionar')).toBeDefined();
    expect(screen.getByText('Respuesta Incorrecta')).toBeDefined();

    expect(selectOf('a').className).toContain('outline-error');
    expect(selectOf('a').className).not.toContain('outline-success');
    expect(selectOf('b').className).toContain('outline-error');
    expect(selectOf('b').className).not.toContain('outline-success');
    expect(screen.getByText('Correcto: 1')).toBeDefined();
    expect(screen.getByText('Correcto: 2')).toBeDefined();
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
    expect(screen.getByText('Completar palabras')).toBeDefined();
    expect(screen.getByText('Respuesta Correcta')).toBeDefined();

    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Hueco 1' });
    expect(input.className).toContain('bg-success');
    expect(input.closest('.tooltip')).toBeNull();
  });

  it('grades a wrong answer as incorrect, shows the correct answer, and disables the input', () => {
    const onResult = resultSpy();
    render(<QuizRunner quiz={[completeWords]} onResult={onResult} onFinished={finishedSpy()} />);

    fireEvent.input(screen.getByRole('textbox', { name: 'Hueco 1' }), {
      target: { value: 'casa' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining({ correct: false }));
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Hueco 1' }).disabled).toBe(true);
    expect(screen.getByText('Completar palabras')).toBeDefined();
    expect(screen.getByText('Respuesta Incorrecta')).toBeDefined();

    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Hueco 1' });
    expect(input.className).toContain('bg-error');
    expect(input.className).not.toContain('bg-success');
    const tooltip = input.parentElement;
    expect(tooltip).not.toBeNull();
    expect(tooltip?.dataset.tip).toBe('Camión');
  });
});
