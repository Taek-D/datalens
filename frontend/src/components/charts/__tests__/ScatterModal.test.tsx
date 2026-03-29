import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { ScatterModal } from '../ScatterModal';

const scatterHandler = http.post('http://localhost:8000/api/scatter', () => {
  return HttpResponse.json({
    points: [{ x: 1, y: 2 }],
    total_count: 1,
  });
});

describe('ScatterModal', () => {
  it('renders modal overlay with correct column names in header', async () => {
    server.use(scatterHandler);

    render(
      <ScatterModal
        colX="age"
        colY="score"
        correlationValue={0.65}
        fileId="test1234"
        onClose={() => {}}
      />,
    );

    // Column names appear in the header
    expect(screen.getByText(/age vs score/i)).toBeDefined();
  });

  it('displays "Showing N of M" label after data loads', async () => {
    server.use(scatterHandler);

    render(
      <ScatterModal
        colX="age"
        colY="score"
        correlationValue={0.65}
        fileId="test1234"
        onClose={() => {}}
      />,
    );

    // Wait for loading to finish and "Showing N of M" to appear
    await waitFor(() => {
      expect(screen.getByText(/Showing 1 of 1/i)).toBeDefined();
    });
  });

  it('calls onClose when Escape key is pressed', () => {
    server.use(scatterHandler);

    const onClose = vi.fn();

    render(
      <ScatterModal
        colX="age"
        colY="score"
        correlationValue={0.65}
        fileId="test1234"
        onClose={onClose}
      />,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    server.use(scatterHandler);

    const onClose = vi.fn();

    render(
      <ScatterModal
        colX="age"
        colY="score"
        correlationValue={0.65}
        fileId="test1234"
        onClose={onClose}
      />,
    );

    // Click on the backdrop (the outer div with role="dialog")
    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
