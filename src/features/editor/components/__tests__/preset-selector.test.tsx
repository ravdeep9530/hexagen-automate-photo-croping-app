import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/data/catalog', () => ({ getAllPresets: () => [] }));

import type { PhotoPreset } from '@/domain';
import { createDefaultState, useEditorStore } from '@/features/editor/store/editor-store';
import { PresetSelector } from '../preset-selector';

const reviewedAt = '2024-01-01T00:00:00.000Z';

function makePreset(id: string, name: string, country: string, documentType: PhotoPreset['documentType']): PhotoPreset {
  return {
    id,
    name,
    country,
    documentType,
    description: `${name} requirements`,
    dimensions: { widthMm: 50, heightMm: 70, widthPx: 600, heightPx: 840, minDpi: 300 },
    fileConstraints: { maxFileSizeMb: 10, acceptedFormats: ['image/jpeg', 'image/png'] },
    source: { country, authority: 'Test authority', url: 'https://example.com', lastReviewed: reviewedAt, documentType },
    isActive: true,
    tags: [],
    createdAt: reviewedAt,
    updatedAt: reviewedAt,
  };
}

describe('PresetSelector', () => {
  beforeEach(() => {
    useEditorStore.setState(createDefaultState(), true);
  });

  it('updates the selected preset and export defaults', () => {
    const presets = [
      makePreset('ca-passport', 'Canada passport', 'Canada', 'passport'),
      makePreset('us-visa', 'United States visa', 'United States', 'visa'),
    ];

    render(<PresetSelector presets={presets} />);

    fireEvent.change(screen.getByLabelText(/preset category/i), { target: { value: 'passport' } });
    fireEvent.change(screen.getByLabelText(/preset country/i), { target: { value: 'Canada' } });
    fireEvent.change(screen.getByLabelText(/photo preset/i), { target: { value: 'ca-passport' } });

    const state = useEditorStore.getState();
    expect(state.selectedPreset?.id).toBe('ca-passport');
    expect(state.exportSettings?.widthPx).toBe(600);
    expect(state.exportSettings?.heightPx).toBe(840);
    expect(screen.getByText(/export defaults: 600 × 840 px at 300 dpi/i)).toBeTruthy();
  });
});
