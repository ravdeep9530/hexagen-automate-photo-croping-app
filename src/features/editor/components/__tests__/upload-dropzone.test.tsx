import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UploadDropzone } from '../upload-dropzone';
import { createDefaultState, useEditorStore } from '@/features/editor/store/editor-store';

function resetStore(): void {
  useEditorStore.setState(createDefaultState(), true);
}

describe('UploadDropzone', () => {
  beforeEach(() => {
    resetStore();
    vi.stubGlobal('crypto', { randomUUID: () => 'asset-test-id' });
  });

  it('stores a valid local image selected through the file picker', async () => {
    const onUploadComplete = vi.fn();
    render(<UploadDropzone onUploadComplete={onUploadComplete} />);

    const file = new File(['image-bytes'], 'portrait.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/choose a local image/i), { target: { files: [file] } });

    await waitFor(() => expect(onUploadComplete).toHaveBeenCalledTimes(1));
    expect(useEditorStore.getState().asset?.name).toBe('portrait.png');
    expect(useEditorStore.getState().asset?.status).toBe('valid');
  });

  it('announces validation feedback for unsupported files', async () => {
    const onUploadError = vi.fn();
    render(<UploadDropzone onUploadError={onUploadError} />);

    const file = new File(['not-image'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText(/choose a local image/i), { target: { files: [file] } });

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/jpg, png, or webp/i);
    expect(onUploadError).toHaveBeenCalledWith(expect.stringMatching(/jpg, png, or webp/i));
    expect(useEditorStore.getState().asset).toBeNull();
  });
});
