import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { PresetSelector, Preset } from '../PresetSelector';

describe('PresetSelector', () => {
  const presets: Preset[] = [
    { code: 'us', name: 'United States' },
    { code: 'ca', name: 'Canada' },
  ];

  it('renders options and allows selection', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <PresetSelector presets={presets} selected={null} onSelect={onSelect} />
    );
    const select = getByTestId('preset-select') as HTMLSelectElement;
    expect(select.children.length).toBe(3); // 2 options + placeholder
    fireEvent.change(select, { target: { value: 'ca' } });
    expect(onSelect).toHaveBeenCalledWith('ca');
  });

  it('shows selected value', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <PresetSelector presets={presets} selected={'us'} onSelect={onSelect} />
    );
    const select = getByTestId('preset-select') as HTMLSelectElement;
    expect(select.value).toBe('us');
  });
});
