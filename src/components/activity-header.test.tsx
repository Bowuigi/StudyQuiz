import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';

import { ActivityHeader } from './activity-header.tsx';

describe('activity header', () => {
  it('shows the label of the activity type in uppercase', () => {
    render(<ActivityHeader type="single-choice" status={null} />);

    expect(screen.getByText('Opción única')).toBeDefined();
  });

  it('shows the label Tarjetas for the card type', () => {
    render(<ActivityHeader type="card" status={null} />);

    expect(screen.getByText('Tarjetas')).toBeDefined();
  });

  it('does not show a status when the status is null', () => {
    render(<ActivityHeader type="card" status={null} />);

    expect(screen.queryByText('Respuesta correcta')).toBeNull();
    expect(screen.queryByText('Respuesta incorrecta')).toBeNull();
  });

  it('shows Respuesta correcta with the success class', () => {
    render(<ActivityHeader type="reorder" status={true} />);

    const status = screen.getByText('Respuesta correcta');
    expect(status.getAttribute('class')).toContain('text-success');
  });

  it('shows Respuesta incorrecta with the error class', () => {
    render(<ActivityHeader type="reorder" status={false} />);

    const status = screen.getByText('Respuesta incorrecta');
    expect(status.getAttribute('class')).toContain('text-error');
  });
});
