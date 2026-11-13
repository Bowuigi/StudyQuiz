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

    expect(screen.queryByText('Respuesta Correcta')).toBeNull();
    expect(screen.queryByText('Respuesta Incorrecta')).toBeNull();
  });

  it('shows Respuesta Correcta with the success class', () => {
    render(<ActivityHeader type="reorder" status={true} />);

    const status = screen.getByText('Respuesta Correcta');
    expect(status.getAttribute('class')).toContain('text-success');
  });

  it('shows Respuesta Incorrecta with the error class', () => {
    render(<ActivityHeader type="reorder" status={false} />);

    const status = screen.getByText('Respuesta Incorrecta');
    expect(status.getAttribute('class')).toContain('text-error');
  });
});
