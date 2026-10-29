import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';

import { App } from './app.tsx';

describe('App shell', () => {
  it('renders the application title and description', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'StudyQuiz' })).toBeDefined();
    expect(screen.getByText('Practica con cuestionarios y revisa tu progreso.')).toBeDefined();
  });
});
