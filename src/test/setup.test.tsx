import { render } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';

import { App } from '../app.tsx';

describe('test setup', () => {
  it('leaves rendered content in the document during a test', () => {
    render(<App />);

    expect(document.body.innerHTML).not.toBe('');
  });

  it('removes rendered content after the previous test', () => {
    expect(document.body.innerHTML).toBe('');
  });
});
