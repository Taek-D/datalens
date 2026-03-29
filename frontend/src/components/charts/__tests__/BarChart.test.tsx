import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BarChartComponent } from '../BarChartComponent';

const categoricalData: Record<string, unknown>[] = [
  { color: 'red' },
  { color: 'blue' },
  { color: 'red' },
  { color: 'green' },
  { color: 'blue' },
  { color: 'red' },
];

describe('BarChartComponent', () => {
  it.todo('renders top 20 categories');

  it('renders without crashing given categorical column data', () => {
    render(<BarChartComponent columnName="color" data={categoricalData} />);
    const container = document.querySelector('.recharts-responsive-container');
    expect(container).not.toBeNull();
  });

  it('renders without crashing when data is empty', () => {
    expect(() =>
      render(<BarChartComponent columnName="color" data={[]} />),
    ).not.toThrow();
  });
});
