'use client';

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEditorStore } from '../../store/editor-store';
import { usePreviewRender } from '../use-preview-render';

describe('usePreviewRender', () => {
  beforeEach(() => {
    useEditorStore.setState(useEditorStore.getState(), true);
    useEditorStore.getState().resetEditor();
  });

  it('returns consistent renderKey when no settings change', () => {
    useEditorStore.setState({
      cropState: {
        x: 0,
        y: 0,
        width: 1000,
        height: 800,
        rotation: 0,
        scale: 1,
        flipHorizontal: false,
        flipVertical: false,
      },
      processingSettings: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        background: { mode: 'original' },
        grayscale: false,
      },
    });

    const { result, rerender } = renderHook(() => usePreviewRender());
    const firstKey = result.current.renderKey;

    rerender();

    expect(result.current.renderKey).toBe(firstKey);
    expect(result.current.renderCount).toBe(1);
  });

  it('changes renderKey when crop settings change', () => {
    useEditorStore.setState({
      cropState: {
        x: 0,
        y: 0,
        width: 1000,
        height: 800,
        rotation: 0,
        scale: 1,
        flipHorizontal: false,
        flipVertical: false,
      },
    });

    const { result } = renderHook(() => usePreviewRender());
    const firstKey = result.current.renderKey;

    act(() => {
      useEditorStore.getState().updateCropPartial({ rotation: 45 });
    });

    expect(result.current.renderKey).not.toBe(firstKey);
    expect(result.current.renderCount).toBe(2);
  });

  it('changes renderKey when processing settings change', () => {
    useEditorStore.setState({
      processingSettings: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        background: { mode: 'original' },
        grayscale: false,
      },
    });

    const { result } = renderHook(() => usePreviewRender());
    const firstKey = result.current.renderKey;

    act(() => {
      useEditorStore.getState().updateProcessingPartial({ brightness: 0.5 });
    });

    expect(result.current.renderKey).not.toBe(firstKey);
    expect(result.current.renderCount).toBe(2);
  });

  it('changes renderKey when background mode changes', () => {
    useEditorStore.setState({
      processingSettings: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        background: { mode: 'original' },
        grayscale: false,
      },
    });

    const { result } = renderHook(() => usePreviewRender());
    const firstKey = result.current.renderKey;

    act(() => {
      useEditorStore.getState().updateBackground({ mode: 'remove' });
    });

    expect(result.current.renderKey).not.toBe(firstKey);
  });

  it('changes renderKey when background color changes', () => {
    useEditorStore.setState({
      processingSettings: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        background: { mode: 'replace', color: '#FFFFFF' },
        grayscale: false,
      },
    });

    const { result } = renderHook(() => usePreviewRender());
    const firstKey = result.current.renderKey;

    act(() => {
      useEditorStore.getState().updateBackground({ mode: 'replace', color: '#3B82F6' });
    });

    expect(result.current.renderKey).not.toBe(firstKey);
  });

  it('changes renderKey when manual refresh is triggered', () => {
    const { result } = renderHook(() => usePreviewRender());
    const firstKey = result.current.renderKey;
    const firstCount = result.current.renderCount;

    act(() => {
      result.current.refreshPreview();
    });

    expect(result.current.renderKey).not.toBe(firstKey);
    expect(result.current.renderCount).toBeGreaterThan(firstCount);
    expect(result.current.refreshedAt).not.toBeNull();
  });

  it('changes renderKey when imageObjectUrl changes', () => {
    useEditorStore.setState({
      runtime: {
        imageObjectUrl: 'blob:old-url',
        isAssetLoading: false,
        isProcessing: false,
        isExporting: false,
        processingProgress: 0,
        exportProgress: 0,
      },
    });

    const { result } = renderHook(() => usePreviewRender());
    const firstKey = result.current.renderKey;

    act(() => {
      useEditorStore.setState({
        runtime: {
          imageObjectUrl: 'blob:new-url',
          isAssetLoading: false,
          isProcessing: false,
          isExporting: false,
          processingProgress: 0,
          exportProgress: 0,
        },
      });
    });

    expect(result.current.renderKey).not.toBe(firstKey);
  });

  it('tracks zoom scale changes', () => {
    useEditorStore.setState({
      cropState: {
        x: 0,
        y: 0,
        width: 1000,
        height: 800,
        rotation: 0,
        scale: 1,
        flipHorizontal: false,
        flipVertical: false,
      },
    });

    const { result } = renderHook(() => usePreviewRender());
    const firstKey = result.current.renderKey;

    act(() => {
      useEditorStore.getState().updateCropPartial({ scale: 2.5 });
    });

    expect(result.current.renderKey).not.toBe(firstKey);
  });

  it('tracks flip state changes', () => {
    useEditorStore.setState({
      cropState: {
        x: 0,
        y: 0,
        width: 1000,
        height: 800,
        rotation: 0,
        scale: 1,
        flipHorizontal: false,
        flipVertical: false,
      },
    });

    const { result } = renderHook(() => usePreviewRender());
    const firstKey = result.current.renderKey;

    act(() => {
      useEditorStore.getState().updateCropPartial({ flipHorizontal: true });
    });

    expect(result.current.renderKey).not.toBe(firstKey);
  });

  it('tracks contrast, brightness, and saturation changes', () => {
    useEditorStore.setState({
      processingSettings: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        background: { mode: 'original' },
        grayscale: false,
      },
    });

    const { result } = renderHook(() => usePreviewRender());
    
    // Test brightness
    const brightnessKey = result.current.renderKey;
    act(() => {
      useEditorStore.getState().updateProcessingPartial({ brightness: 0.75 });
    });
    expect(result.current.renderKey).not.toBe(brightnessKey);

    // Test contrast
    const contrastKey = result.current.renderKey;
    act(() => {
      useEditorStore.getState().updateProcessingPartial({ contrast: 0.5 });
    });
    expect(result.current.renderKey).not.toBe(contrastKey);

    // Test saturation
    const saturationKey = result.current.renderKey;
    act(() => {
      useEditorStore.getState().updateProcessingPartial({ saturation: 0.25 });
    });
    expect(result.current.renderKey).not.toBe(saturationKey);
  });

  it('serializes numeric values consistently', () => {
    useEditorStore.setState({
      cropState: {
        x: 100.1234567,
        y: 200.9876543,
        width: 500,
        height: 400,
        rotation: 45.123456,
        scale: 1.234567,
        flipHorizontal: false,
        flipVertical: false,
      },
    });

    const { result, rerender } = renderHook(() => usePreviewRender());
    const firstKey = result.current.renderKey;

    // Simply rerender - key should be stable
    rerender();
    expect(result.current.renderKey).toBe(firstKey);
  });
});
