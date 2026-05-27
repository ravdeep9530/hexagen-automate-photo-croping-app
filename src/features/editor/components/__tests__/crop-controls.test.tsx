'use client';

import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ImageAsset } from '@/domain';

import { useEditorStore } from '../../store/editor-store';
import { CropControls, CROP_LIMITS } from '../crop-controls';

// Mock the preview render hook
let mockRefresh = vi.fn();
vi.mock('../../hooks/use-preview-render', () => ({
  usePreviewRender: () => ({
    refreshPreview: mockRefresh,
    renderKey: 'test-key',
    renderCount: 0,
    refreshedAt: null,
    isRefreshPending: false,
  }),
}));

describe('CropControls', () => {
  const mockAsset: ImageAsset = {
    id: 'test-asset',
    mimeType: 'image/jpeg',
    metadata: {
      width: 2000,
      height: 1500,
      aspectRatio: 4 / 3,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRefresh = vi.fn();
    useEditorStore.setState(useEditorStore.getState(), true);
    useEditorStore.getState().resetCrop();
  });

  it('renders all crop controls with accessible labels', () => {
    useEditorStore.setState({
      asset: mockAsset,
      cropState: {
        x: 0,
        y: 0,
        width: 1000,
        height: 750,
        rotation: 0,
        scale: 1,
        flipHorizontal: false,
        flipVertical: false,
      },
    });

    render(<CropControls />);

    expect(screen.getByLabelText(/zoom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rotation/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/horizontal crop position/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/vertical crop position/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/grid overlay/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/head and eye guides/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/flip horizontal/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/flip vertical/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reset crop controls/i)).toBeInTheDocument();
  });

  it('disables controls when cropState is null', () => {
    useEditorStore.setState({ asset: null, cropState: null });
    render(<CropControls />);

    expect(screen.getByLabelText(/zoom/i)).toBeDisabled();
    expect(screen.getByLabelText(/rotation/i)).toBeDisabled();
  });

  it('disables controls when disabled prop is true', () => {
    useEditorStore.setState({
      asset: mockAsset,
      cropState: {
        x: 0,
        y: 0,
        width: 1000,
        height: 750,
        rotation: 0,
        scale: 1,
        flipHorizontal: false,
        flipVertical: false,
      },
    });
    render(<CropControls disabled />);

    expect(screen.getByLabelText(/zoom/i)).toBeDisabled();
    expect(screen.getByLabelText(/rotation/i)).toBeDisabled();
  });

  it('reflects store values in controls', () => {
    useEditorStore.setState({
      asset: mockAsset,
      cropState: {
        x: 100,
        y: 50,
        width: 1000,
        height: 750,
        rotation: 45,
        scale: 1.5,
        flipHorizontal: true,
        flipVertical: false,
      },
    });

    render(<CropControls />);

    expect(screen.getByLabelText(/zoom/i)).toHaveValue('1.5');
    expect(screen.getByLabelText(/rotation/i)).toHaveValue('45');
    expect(screen.getByLabelText(/horizontal crop position/i)).toHaveValue('100');
    expect(screen.getByLabelText(/vertical crop position/i)).toHaveValue('50');
  });

  it('clamps zoom within bounds', async () => {
    const user = userEvent.setup();
    useEditorStore.setState({
      asset: mockAsset,
      cropState: {
        x: 0,
        y: 0,
        width: 1000,
        height: 750,
        rotation: 0,
        scale: 1,
        flipHorizontal: false,
        flipVertical: false,
      },
    });

    render(<CropControls />);

    const zoomSlider = screen.getByLabelText(/zoom/i) as HTMLInputElement;

    await act(async () => {
      await user.clear(zoomSlider);
      await user.type(zoomSlider, '10');
      await user.tab();
    });

    await waitFor(() => {
      const state = useEditorStore.getState();
      expect(state.cropState?.scale).toBe(CROP_LIMITS.zoom.max);
    });

    await act(async () => {
      await user.clear(zoomSlider);
      await user.type(zoomSlider, '0.1');
      await user.tab();
    });

    await waitFor(() => {
      const state = useEditorStore.getState();
      expect(state.cropState?.scale).toBe(CROP_LIMITS.zoom.min);
    });
  });

  it('clamps rotation within bounds', async () => {
    const user = userEvent.setup();
    useEditorStore.setState({
      asset: mockAsset,
      cropState: {
        x: 0,
        y: 0,
        width: 1000,
        height: 750,
        rotation: 0,
        scale: 1,
        flipHorizontal: false,
        flipVertical: false,
      },
    });

    render(<CropControls />);

    const rotationSlider = screen.getByLabelText(/rotation/i) as HTMLInputElement;

    await act(async () => {
      await user.clear(rotationSlider);
      await user.type(rotationSlider, '999');
      await user.tab();
    });

    await waitFor(() => {
      const state = useEditorStore.getState();
      expect(state.cropState?.rotation).toBe(CROP_LIMITS.rotation.max);
    });
  });

  it('toggles flip controls', async () => {
    const user = userEvent.setup();
    useEditorStore.setState({
      asset: mockAsset,
      cropState: {
        x: 0,
        y: 0,
        width: 1000,
        height: 750,
        rotation: 0,
        scale: 1,
        flipHorizontal: false,
        flipVertical: false,
      },
    });

    render(<CropControls />);

    const flipHButton = screen.getByLabelText(/flip horizontal/i);
    const flipVButton = screen.getByLabelText(/flip vertical/i);

    await user.click(flipHButton);
    await waitFor(() => {
      expect(useEditorStore.getState().cropState?.flipHorizontal).toBe(true);
    });

    await user.click(flipVButton);
    await waitFor(() => {
      expect(useEditorStore.getState().cropState?.flipVertical).toBe(true);
    });
  });

  it('toggles grid overlay via checkbox', async () => {
    const user = userEvent.setup();
    useEditorStore.setState({
      asset: mockAsset,
      cropState: {
        x: 0,
        y: 0,
        width: 1000,
        height: 750,
        rotation: 0,
        scale: 1,
        flipHorizontal: false,
        flipVertical: false,
      },
    });

    render(<CropControls />);

    const gridToggle = screen.getByLabelText(/grid overlay/i) as HTMLInputElement;
    expect(gridToggle).toBeChecked();

    await user.click(gridToggle);
    await waitFor(() => {
      expect(useEditorStore.getState().preferences.editor.showGuides).toBe(false);
    });
  });

  it('toggles head/eye guides via checkbox', async () => {
    const user = userEvent.setup();
    useEditorStore.setState({
      asset: mockAsset,
      cropState: {
        x: 0,
        y: 0,
        width: 1000,
        height: 750,
        rotation: 0,
        scale: 1,
        flipHorizontal: false,
        flipVertical: false,
      },
    });

    render(<CropControls />);

    const guidesToggle = screen.getByLabelText(/head and eye guides/i) as HTMLInputElement;
    expect(guidesToggle).toBeChecked();

    await user.click(guidesToggle);
    await waitFor(() => {
      expect(useEditorStore.getState().preferences.editor.showFaceOverlay).toBe(false);
    });
  });

  it('resets crop when reset button is clicked', async () => {
    const user = userEvent.setup();
    useEditorStore.setState({
      asset: mockAsset,
      cropState: {
        x: 500,
        y: 400,
        width: 800,
        height: 600,
        rotation: 90,
        scale: 2,
        flipHorizontal: true,
        flipVertical: true,
      },
    });

    render(<CropControls />);

    const resetButton = screen.getByLabelText(/reset crop controls/i);
    await user.click(resetButton);

    await waitFor(() => {
      const state = useEditorStore.getState();
      // Should reset to calculated crop for the asset
      expect(state.cropState).not.toBeNull();
    });
  });

  it('has correct ARIA attributes for accessibility', () => {
    useEditorStore.setState({
      asset: mockAsset,
      cropState: {
        x: 0,
        y: 0,
        width: 1000,
        height: 750,
        rotation: 0,
        scale: 1,
        flipHorizontal: false,
        flipVertical: false,
      },
    });

    render(<CropControls />);

    // Flip buttons should have aria-pressed
    const flipHButton = screen.getByLabelText(/flip horizontal/i);
    expect(flipHButton).toHaveAttribute('aria-pressed', 'false');

    // Section should have aria-label
    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-label', 'Crop, position, and guide controls');
  });

  it('renders zoom in/out buttons', async () => {
    const user = userEvent.setup();
    useEditorStore.setState({
      asset: mockAsset,
      cropState: {
        x: 0,
        y: 0,
        width: 1000,
        height: 750,
        rotation: 0,
        scale: 1,
        flipHorizontal: false,
        flipVertical: false,
      },
    });

    render(<CropControls />);

    const zoomInButton = screen.getByLabelText(/zoom in/i);
    const zoomOutButton = screen.getByLabelText(/zoom out/i);

    expect(zoomInButton).toBeInTheDocument();
    expect(zoomOutButton).toBeInTheDocument();

    await user.click(zoomInButton);
    await waitFor(() => {
      expect(useEditorStore.getState().cropState?.scale).toBeGreaterThan(1);
    });
  });

  it('renders rotate left/right buttons', async () => {
    const user = userEvent.setup();
    useEditorStore.setState({
      asset: mockAsset,
      cropState: {
        x: 0,
        y: 0,
        width: 1000,
        height: 750,
        rotation: 0,
        scale: 1,
        flipHorizontal: false,
        flipVertical: false,
      },
    });

    render(<CropControls />);

    const rotateLeftButton = screen.getByLabelText(/rotate left/i);
    const rotateRightButton = screen.getByLabelText(/rotate right/i);

    expect(rotateLeftButton).toBeInTheDocument();
    expect(rotateRightButton).toBeInTheDocument();

    await user.click(rotateRightButton);
    await waitFor(() => {
      expect(useEditorStore.getState().cropState?.rotation).toBeGreaterThan(0);
    });
  });

  it('clamps pan x/y position to valid bounds', async () => {
    const user = userEvent.setup();
    useEditorStore.setState({
      asset: mockAsset,
      cropState: {
        x: 0,
        y: 0,
        width: 500,
        height: 375,
        rotation: 0,
        scale: 1,
        flipHorizontal: false,
        flipVertical: false,
      },
    });

    render(<CropControls />);

    const panXInput = screen.getByLabelText(/horizontal crop position/i) as HTMLInputElement;
    
    await act(async () => {
      await user.clear(panXInput);
      await user.type(panXInput, '9999');
      await user.tab();
    });

    await waitFor(() => {
      const state = useEditorStore.getState();
      // Should be clamped to maxX
      expect(state.cropState?.x).toBeLessThanOrEqual(1500);
    });
  });
});
