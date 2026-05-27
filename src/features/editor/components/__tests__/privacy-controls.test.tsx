import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';

import { PrivacyControls } from '@/features/editor/components/privacy-controls';
import useEditorStore from '@/features/editor/store/editor-store';

class MemoryStorage implements Storage {
  values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  clear(): void {
    this.values.clear();
  }
}

describe('PrivacyControls', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      writable: true,
      configurable: true,
    });

    useEditorStore.setState(
      {
        ...useEditorStore.getState(),
        asset: null,
        cropState: null,
        processingSettings: {
          brightness: 0,
          contrast: 0,
          saturation: 0,
          sharpness: 0,
          background: { mode: 'original' },
          skinSmoothing: 0,
          redEyeReduction: false,
          autoEnhance: false,
          grayscale: false,
        },
      },
      true
    );
  });

  it('renders the privacy controls panel', () => {
    render(<PrivacyControls />);
    expect(screen.getByText(/Privacy & local data/i)).toBeTruthy();
    expect(screen.getByText(/Remember my session/i)).toBeTruthy();
    expect(screen.getByText(/Clear local data/i)).toBeTruthy();
  });
});
