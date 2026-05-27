'use client';

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resetBackgroundRemovalLoaderForTests, setBackgroundRemovalModuleLoaderForTests } from '../../ai/background-removal';
import { useEditorStore } from '../../store/editor-store';
import { useBackgroundRemoval } from '../use-background-removal';

const removeBackgroundMock = vi.fn();

const makeAsset = () => ({
  id: 'asset-1',
  name: 'photo.png',
  file: new File(['source'], 'photo.png', { type: 'image/png' }),
  blobUrl: 'blob:source',
  metadata: {
    width: 100,
    height: 120,
    aspectRatio: 100 / 120,
    format: 'png' as const,
    colorMode: 'rgba' as const,
    hasAlpha: true,
    fileSizeBytes: 6,
  },
  status: 'valid' as const,
  uploadedAt: new Date().toISOString(),
});

describe('useBackgroundRemoval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetBackgroundRemovalLoaderForTests();
    setBackgroundRemovalModuleLoaderForTests(async () => ({ removeBackground: removeBackgroundMock } as never));
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:removed'),
      revokeObjectURL: vi.fn(),
    });
    useEditorStore.setState(useEditorStore.getState(), true);
    useEditorStore.getState().resetEditor();
  });

  it('does not load the AI bundle while background mode is original', () => {
    const asset = makeAsset();
    useEditorStore.getState().setAsset(asset, asset.file);

    const { result } = renderHook(() => useBackgroundRemoval());

    expect(result.current.status).toBe('idle');
    expect(removeBackgroundMock).not.toHaveBeenCalled();
  });

  it('stores the processed image reference after successful removal', async () => {
    removeBackgroundMock.mockResolvedValue(new Blob(['removed'], { type: 'image/png' }));
    const asset = makeAsset();
    useEditorStore.getState().setAsset(asset, asset.file);

    const { result } = renderHook(() => useBackgroundRemoval());

    act(() => {
      useEditorStore.getState().updateBackground({ mode: 'remove' });
    });

    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(result.current.asset?.objectUrl).toBe('blob:removed');
    expect(result.current.errorMessage).toBeNull();
  });

  it('prevents cancelled stale results from overwriting newer edits', async () => {
    let resolveFirst: (blob: Blob) => void = () => undefined;
    removeBackgroundMock.mockImplementationOnce(() => new Promise<Blob>((resolve) => { resolveFirst = resolve; }));
    const asset = makeAsset();
    useEditorStore.getState().setAsset(asset, asset.file);

    const { result } = renderHook(() => useBackgroundRemoval());
    act(() => {
      useEditorStore.getState().updateBackground({ mode: 'remove' });
    });
    await waitFor(() => expect(result.current.status).toBe('processing'));

    act(() => {
      result.current.cancel();
    });
    act(() => {
      resolveFirst(new Blob(['late']));
    });

    await waitFor(() => expect(result.current.status).toBe('idle'));
    expect(result.current.asset).toBeNull();
  });

  it('shows fallback messaging on failure and leaves other modes usable', async () => {
    removeBackgroundMock.mockRejectedValue(new Error('model failed'));
    const asset = makeAsset();
    useEditorStore.getState().setAsset(asset, asset.file);

    const { result } = renderHook(() => useBackgroundRemoval());
    act(() => {
      useEditorStore.getState().updateBackground({ mode: 'remove' });
    });

    await waitFor(() => expect(result.current.status).toBe('failed'));
    expect(result.current.errorMessage).toContain('original');

    act(() => {
      useEditorStore.getState().updateBackground({ mode: 'original' });
    });

    await waitFor(() => expect(result.current.status).toBe('idle'));
  });
});
