import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistogramChart } from '../HistogramChart';

const numericData: Record<string, unknown>[] = [
  { age: 25 },
  { age: 30 },
  { age: 22 },
  { age: 45 },
  { age: 28 },
];

describe('HistogramChart', () => {
  it.todo('renders histogram bins for numeric data');

  it('renders without crashing given numeric column data', () => {
    render(<HistogramChart columnName="age" data={numericData} />);
    // ResponsiveContainer renders into the DOM
    const container = document.querySelector('.recharts-responsive-container');
    expect(container).not.toBeNull();
  });

  it('renders without crashing when data is empty', () => {
    expect(() =>
      render(<HistogramChart columnName="age" data={[]} />),
    ).not.toThrow();
  });
});
