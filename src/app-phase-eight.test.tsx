import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './app.tsx';
import type { Subject } from './content.ts';
import { getStats, resetStats } from './storage.ts';

const subject: Subject = {
  name: 'demo',
  topics: [
    {
      id: 'demo/tema',
      subject: 'demo',
      name: 'tema',
      activities: [
        {
          is: 'single-choice',
          question: 'Primera pregunta',
          options: [
            { label: 'Alpha', explanation: 'Explicación correcta.' },
            { label: 'Incorrecta uno', explanation: 'Explicación incorrecta.' },
          ],
        },
        {
          is: 'single-choice',
          question: 'Segunda pregunta',
          options: [
            { label: 'Beta', explanation: 'Explicación correcta.' },
            { label: 'Incorrecta dos', explanation: 'Explicación incorrecta.' },
          ],
        },
      ],
    },
  ],
};

beforeEach(async () => {
  await resetStats();
});

describe('phase eight integration', () => {
  it('stores every confirmed result and shows the summary', async () => {
    let currentTime = 0;
    render(<App subjects={[subject]} now={() => currentTime} />);

    fireEvent.click(screen.getByRole('button', { name: 'demo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Comenzar' }));

    fireEvent.click(screen.getByRole('radio', { name: /^(Alpha|Beta)$/ }));
    currentTime = 10_000;

    await waitFor(async () => {
      const records = await getStats();
      expect(records[0]).toMatchObject({ attempts: 1, correct: 1 });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    currentTime = 65_000;
    fireEvent.click(screen.getByRole('radio', { name: /^(Alpha|Beta)$/ }));

    await waitFor(async () => {
      const records = await getStats();
      expect(records[0]).toMatchObject({ attempts: 2, correct: 2 });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(screen.getByRole('heading', { name: 'Resumen del cuestionario' })).toBeDefined();
    expect(screen.getByTestId('summary-correct-count').textContent).toBe('2');
    expect(screen.getByText('100%')).toBeDefined();
    expect(screen.getByText('1 min 5 s')).toBeDefined();
  });

  it('returns to the home view from the summary', () => {
    render(<App subjects={[subject]} now={() => 0} />);

    fireEvent.click(screen.getByRole('button', { name: 'demo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Comenzar' }));
    fireEvent.click(screen.getByRole('radio', { name: /^(Alpha|Beta)$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    fireEvent.click(screen.getByRole('radio', { name: /^(Alpha|Beta)$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    fireEvent.click(screen.getByRole('button', { name: 'Volver al inicio' }));

    expect(screen.getByRole('heading', { name: 'Intentar' })).toBeDefined();
  });
});
