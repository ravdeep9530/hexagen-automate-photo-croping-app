'use client';

import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEditorStore } from '../../store/editor-store';
import { ProcessingControls } from '../processing-controls';

// Mock the deps
vi.mock('../../hooks/use-preview-render', () => ({
  usePreviewRender: () => ({
    refreshPreview: vi.fn(),
    renderKey: 'test-key',
    renderCount: 0,
    refreshedAt: null,
    isRefreshPending: false,
  }),
}));

describe('ProcessingControls', () => {
  beforeEach(() => {
    useEditorStore.setState(useEditorStore.getState(), true);
    useEditorStore.getState().resetProcessingSettings();
  });

  it('renders all adjustment controls with accessible labels', () => {
    render(<ProcessingControls />);

    expect(screen.getByLabelText(/brightness/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contrast/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/saturation/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/grayscale/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh preview/i })).toBeInTheDocument();
  });

  it('reflects store values in sliders', () => {
    useEditorStore.getState().updateProcessingPartial({
      brightness: 0.5,
      contrast: -0.3,
      saturation: 0.2,
    });

    render(<ProcessingControls />);

    expect(screen.getByLabelText(/brightness/i)).toHaveValue('0.5');
    expect(screen.getByLabelText(/contrast/i)).toHaveValue('-0.3');
    expect(screen.getByLabelText(/saturation/i)).toHaveValue('0.2');
  });

  it('clamps adjustment values within bounds when adjusted via input', async () => {
    const user = userEvent.setup();
    render(<ProcessingControls />);

    const brightnessSlider = screen.getByLabelText(/brightness/i) as HTMLInputElement;

    await act(async () => {
      await user.clear(brightnessSlider);
      await user.type(brightnessSlider, '999');
      await user.tab();
    });

    await waitFor(() => {
      const state = useEditorStore.getState();
      expect(state.processingSettings.brightness).toBe(1);
    });

    await act(async () => {
      await user.clear(brightnessSlider);
      await user.type(brightnessSlider, '-999');
      await user.tab();
    });

    await waitFor(() => {
      const state = useEditorStore.getState();
      expect(state.processingSettings.brightness).toBe(-1);
    });
  });

  it('toggles background mode buttons and updates store', async () => {
    const user = userEvent.setup();
    render(<ProcessingControls />);

    const colorButton = screen.getByRole('button', { name: /color/i });
    const removeButton = screen.getByRole('button', { name: /remove/i });
    const originalButton = screen.getByRole('button', { name: /original/i });

    await user.click(colorButton);
    expect(useEditorStore.getState().processingSettings.background.mode).toBe('replace');
    expect(colorButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(removeButton);
    expect(useEditorStore.getState().processingSettings.background.mode).toBe('remove');
    expect(removeButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(originalButton);
    expect(useEditorStore.getState().processingSettings.background.mode).toBe('original');
  });

  it('disables controls when disabled prop is true', () => {
    render(<ProcessingControls disabled />);

    expect(screen.getByLabelText(/brightness/i)).toBeDisabled();
    expect(screen.getByLabelText(/contrast/i)).toBeDisabled();
    expect(screen.getByLabelText(/saturation/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /original/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /color/i })).toBeDisabled();
  });

  it('shows color picker when replace mode is selected', async () => {
    const user = userEvent.setup();
    render(<ProcessingControls />);

    // Should not show color picker initially (mode is 'original')
    expect(screen.queryByLabelText(/custom background color/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /color/i }));

    // Now color picker should be visible
    expect(screen.getByLabelText(/custom background color/i)).toBeInTheDocument();
  });

  it('shows blur control when blur mode is selected', async () => {
    const user = userEvent.setup();
    render(<ProcessingControls />);

    // Should not show blur slider initially
    expect(screen.queryByLabelText(/background blur/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /blur/i }));

    // Now blur slider should be visible
    expect(screen.getByLabelText(/background blur/i)).toBeInTheDocument();
  });

  it('clamps blur amount within bounds', async () => {
    const user = userEvent.setup();
    render(<ProcessingControls />);

    // Switch to blur mode first
    await user.click(screen.getByRole('button', { name: /blur/i }));

    const blurSlider = screen.getByLabelText(/background blur/i) as HTMLInputElement;

    await act(async () => {
      await user.clear(blurSlider);
      await user.type(blurSlider, '999');
      await user.tab();
    });

    await waitFor(() => {
      const state = useEditorStore.getState();
      expect(state.processingSettings.background.blurAmount).toBe(24);
    });

    await act(async () => {
      await user.clear(blurSlider);
      await user.type(blurSlider, '-999');
      await user.tab();
    });

    await waitFor(() => {
      const state = useEditorStore.getState();
      expect(state.processingSettings.background.blurAmount).toBe(0);
    });
  });

  it('toggles grayscale via checkbox', async () => {
    const user = userEvent.setup();
    render(<ProcessingControls />);

    const grayscaleToggle = screen.getByLabelText(/grayscale/i) as HTMLInputElement;
    expect(grayscaleToggle).not.toBeChecked();

    await user.click(grayscaleToggle);

    await waitFor(() => {
      expect(useEditorStore.getState().processingSettings.grayscale).toBe(true);
    });

    await user.click(grayscaleToggle);

    await waitFor(() => {
      expect(useEditorStore.getState().processingSettings.grayscale).toBe(false);
    });
  });

  it('preselects color preset and updates store', async () => {
    const user = userEvent.setup();
    render(<ProcessingControls />);

    await user.click(screen.getByRole('button', { name: /color/i }));
    const white = screen.getByRole('button', { name: /set background color to white/i });
    const blue = screen.getByRole('button', { name: /set background color to blue/i });

    await user.click(blue);
    expect(useEditorStore.getState().processingSettings.background.color).toBe('#3B82F6');
    expect(blue).toHaveAttribute('aria-pressed', 'true');

    await user.click(white);
    expect(useEditorStore.getState().processingSettings.background.color).toBe('#FFFFFF');
    expect(white).toHaveAttribute('aria-pressed', 'true');
  });

  it('updates store and marks refresh pending when brightness changes', async () => {
    const user = userEvent.setup();
    // Mock use-preview-render to track calls
    const mockRefresh = vi.fn();
    const { usePreviewRender } = await import('../../hooks/use-preview-render');
    vi.mocked(usePreviewRender).mockImplementation(() => ({
      refreshPreview: mockRefresh,
      renderKey: 'test-key',
      renderCount: 0,
      refreshedAt: null,
      isRefreshPending: false,
    }));

    render(<ProcessingControls />);

    const brightnessSlider = screen.getByLabelText(/brightness/i) as HTMLInputElement;

    await act(async () => {
      await user.clear(brightnessSlider);
      await user.type(brightnessSlider, '0.5');
      await user.tab();
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('has correct ARIA attributes for accessibility', () => {
    render(<ProcessingControls />);

    const brightnessSlider = screen.getByLabelText(/brightness/i);
    expect(brightnessSlider).toHaveAttribute('role', 'slider');

    const originalButton = screen.getByRole('button', { name: /original/i });
    expect(originalButton).toHaveAttribute('aria-pressed');
  });
});
