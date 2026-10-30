import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getStats, recordResult, resetStats } from '../storage.ts';
import { StatsView } from './stats-view.tsx';

beforeEach(async () => {
  await resetStats();
});

async function seedTopicStats(): Promise<void> {
  await recordResult({
    topicId: 'demo/tema',
    subject: 'demo',
    topic: 'tema',
    type: 'single-choice',
    correct: true,
  });
  await recordResult({
    topicId: 'demo/tema',
    subject: 'demo',
    topic: 'tema',
    type: 'card',
    correct: false,
  });
}

describe('statistics view', () => {
  it('groups topics by subject and shows a progress bar for each topic and activity type', async () => {
    await seedTopicStats();

    render(<StatsView onBack={vi.fn<() => void>()} />);

    expect(await screen.findByRole('heading', { name: 'demo' })).toBeDefined();
    expect(screen.getByRole('heading', { name: 'tema' })).toBeDefined();
    expect(screen.getByRole('progressbar', { name: 'Progreso de demo/tema' })).toHaveProperty(
      'value',
      50,
    );
    expect(
      screen.getByRole('progressbar', { name: 'Progreso de Opción única en demo/tema' }),
    ).toHaveProperty('value', 100);
    expect(
      screen.getByRole('progressbar', { name: 'Progreso de Tarjetas en demo/tema' }),
    ).toHaveProperty('value', 0);
  });

  it('erases stored statistics after reset confirmation and shows no data', async () => {
    await recordResult({
      topicId: 'demo/tema',
      subject: 'demo',
      topic: 'tema',
      type: 'card',
      correct: true,
    });

    render(<StatsView onBack={vi.fn<() => void>()} />);
    await screen.findByRole('heading', { name: 'demo' });

    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar estadísticas' }));
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(screen.getByText('No hay estadísticas todavía.')).toBeDefined();
    });
    expect(await getStats()).toEqual([]);
  });
});
