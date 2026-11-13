import { readFileSync } from 'node:fs';

import { fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_THEME, THEMES } from '../themes.ts';
import { ThemeSelect } from './theme-select.tsx';

const STORAGE_KEY = 'study-quiz-theme';
const storage: Storage = localStorage;

function clearStorage(): void {
  storage.removeItem(STORAGE_KEY);
}

function renderThemeSelect(): void {
  render(<ThemeSelect />);
}

function selectElement(): HTMLSelectElement {
  return screen.getByLabelText('Tema') as HTMLSelectElement;
}

function capitalize(theme: string): string {
  return theme.charAt(0).toUpperCase() + theme.slice(1);
}

describe('ThemeSelect', () => {
  beforeEach(() => {
    clearStorage();
  });

  afterEach(() => {
    clearStorage();
  });

  it('renders one option per daisyUI theme', () => {
    renderThemeSelect();

    const select = selectElement();
    const values = [...select.options].map(option => option.value);
    const labels = [...select.options].map(option => option.text);
    expect(values).toHaveLength(THEMES.length);
    for (const theme of THEMES) {
      expect(values).toContain(theme);
      expect(labels).toContain(capitalize(theme));
    }
  });

  it('applies the selected theme to the html element and writes it to localStorage', () => {
    renderThemeSelect();

    fireEvent.change(selectElement(), { target: { value: 'nord' } });

    expect(document.documentElement.dataset.theme).toBe('nord');
    expect(storage.getItem(STORAGE_KEY)).toBe('nord');
  });

  it('applies the stored theme when the app starts', () => {
    storage.setItem(STORAGE_KEY, 'sunset');

    renderThemeSelect();

    expect(document.documentElement.dataset.theme).toBe('sunset');
    expect(selectElement().value).toBe('sunset');
  });

  it('ignores a stored theme that is not in the list', () => {
    storage.setItem(STORAGE_KEY, 'not-a-theme');

    renderThemeSelect();

    expect(document.documentElement.dataset.theme).toBe(DEFAULT_THEME);
    expect(selectElement().value).toBe(DEFAULT_THEME);
  });

  it('starts with the default theme', () => {
    renderThemeSelect();

    expect(document.documentElement.dataset.theme).toBe(DEFAULT_THEME);
  });
});

describe('theme CSS', () => {
  it('builds all the themes', () => {
    const css = readFileSync('src/app.css', 'utf8');
    expect(css).toContain('themes: all');
  });
});
