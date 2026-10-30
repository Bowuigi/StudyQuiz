import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import type { QuizResult } from './quiz-result.ts';
import { SummaryView } from './summary-view.tsx';

const correctResult: QuizResult = {
  item: {
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
  },
  answer: { is: 'single-choice', selected: 0 },
  correct: true,
};

const wrongResult: QuizResult = {
  item: correctResult.item,
  answer: { is: 'single-choice', selected: 1 },
  correct: false,
};

describe('summary view', () => {
  it('shows the correct count, wrong count, percentage, and elapsed time', () => {
    render(
      <SummaryView
        results={[correctResult, wrongResult]}
        elapsedSeconds={65}
        onHome={vi.fn<() => void>()}
      />,
    );

    expect(screen.getByTestId('summary-correct-count').textContent).toBe('1');
    expect(screen.getByTestId('summary-wrong-count').textContent).toBe('1');
    expect(screen.getByText('50%')).toBeDefined();
    expect(screen.getByText('1 min 5 s')).toBeDefined();
  });

  it('lists every wrong activity with the user answer, correct answer, and explanation', () => {
    render(
      <SummaryView
        results={[correctResult, wrongResult]}
        elapsedSeconds={0}
        onHome={vi.fn<() => void>()}
      />,
    );

    const wrongActivities = screen.getAllByTestId('wrong-activity');
    expect(wrongActivities).toHaveLength(1);
    expect(wrongActivities[0]?.textContent).toContain('¿Cuál es la capital de Italia?');
    expect(wrongActivities[0]?.textContent).toContain('París');
    expect(wrongActivities[0]?.textContent).toContain('Roma');
    expect(wrongActivities[0]?.textContent).toContain('París no es la capital.');
  });

  it('returns to the home view', () => {
    const onHome = vi.fn<() => void>();
    render(<SummaryView results={[correctResult]} elapsedSeconds={0} onHome={onHome} />);

    fireEvent.click(screen.getByRole('button', { name: 'Volver al inicio' }));

    expect(onHome).toHaveBeenCalledTimes(1);
  });
});
