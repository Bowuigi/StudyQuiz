import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';

import { App } from './app.tsx';
import { loadSubjects } from './content.ts';

const ACTIVITY_TYPE_LABELS = [
  'Opción múltiple',
  'Opción única',
  'Ordenar',
  'Relacionar',
  'Completar palabras',
  'Tarjetas',
];

function openHistoria(): void {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'historia' }));
}

describe('App shell', () => {
  it('renders the application title and description', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'StudyQuiz' })).toBeDefined();
    expect(screen.getByText('Practica con cuestionarios y revisa tu progreso.')).toBeDefined();
  });
});

describe('home view', () => {
  it('lists every sample subject', () => {
    render(<App />);

    for (const subject of loadSubjects()) {
      expect(screen.getByRole('button', { name: subject.name })).toBeDefined();
    }
  });

  it('shows an empty message when there is no content', () => {
    render(<App subjects={[]} />);

    expect(screen.getByText('No hay contenido disponible.')).toBeDefined();
  });
});

describe('topic view', () => {
  it('opens the topic view for the clicked subject', () => {
    openHistoria();

    expect(screen.getByRole('heading', { name: 'historia' })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'antigua-roma' })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'revolucion-francesa' })).toBeDefined();
  });

  it('starts with all topic and activity type checkboxes checked', () => {
    openHistoria();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2 + ACTIVITY_TYPE_LABELS.length);

    for (const checkbox of checkboxes) {
      expect((checkbox as HTMLInputElement).checked).toBe(true);
    }
  });
});

describe('Comenzar availability', () => {
  it('is disabled when no topic is selected', () => {
    openHistoria();

    const comenzar = screen.getByRole<HTMLButtonElement>('button', { name: 'Comenzar' });
    expect(comenzar.disabled).toBe(false);

    fireEvent.click(screen.getByRole('checkbox', { name: 'antigua-roma' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'revolucion-francesa' }));
    expect(comenzar.disabled).toBe(true);
  });

  it('is disabled when no activity type is selected', () => {
    openHistoria();

    for (const label of ACTIVITY_TYPE_LABELS) {
      fireEvent.click(screen.getByRole('checkbox', { name: label }));
    }

    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Comenzar' }).disabled).toBe(true);
  });
});

describe('quiz building', () => {
  it('builds a quiz with the requested count', () => {
    openHistoria();

    fireEvent.input(screen.getByLabelText('Número de actividades'), {
      target: { value: '3' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Comenzar' }));

    expect(screen.getByText('1 de 3')).toBeDefined();
  });

  it('caps the quiz at the available count', () => {
    openHistoria();

    expect(screen.getByText('Actividades disponibles: 4')).toBeDefined();

    fireEvent.input(screen.getByLabelText('Número de actividades'), {
      target: { value: '99' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Comenzar' }));

    expect(screen.getByText('1 de 4')).toBeDefined();
  });
});
