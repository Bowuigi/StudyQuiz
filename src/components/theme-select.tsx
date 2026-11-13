import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { DEFAULT_THEME, type Theme, THEMES } from '../themes.ts';

const STORAGE_KEY = 'study-quiz-theme';

function themeLabel(theme: Theme): string {
  return theme.charAt(0).toUpperCase() + theme.slice(1);
}

export function ThemeSelect(): JSX.Element {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const next: Theme =
      stored !== null && THEMES.includes(stored as Theme) ? (stored as Theme) : DEFAULT_THEME;
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);

  function onChange(event: Event): void {
    const target = event.currentTarget as HTMLSelectElement;
    const { value } = target;
    if (!THEMES.includes(value as Theme)) {
      return;
    }
    const next = value as Theme;
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <div class="flex items-center gap-2">
      <label class="label cursor-pointer" htmlFor="theme-select">
        <span class="label-text">Tema</span>
      </label>
      <select id="theme-select" class="select select-sm" value={theme} onChange={onChange}>
        {THEMES.map(option => (
          <option key={option} value={option}>
            {themeLabel(option)}
          </option>
        ))}
      </select>
    </div>
  );
}
