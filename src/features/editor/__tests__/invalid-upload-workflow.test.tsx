import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, within, fireEvent } from '@testing-library/react';

import { createMockFile, createMockFileList, mockFileReader } from '@/test/mocks/file';

describe('Invalid Upload Workflow', () => {
  let fileReaderMock: ReturnType<typeof mockFileReader>;

  beforeEach(() => {
    vi.clearAllMocks();
    fileReaderMock = mockFileReader();
  });

  afterEach(() => {
    fileReaderMock.restore();
  });

  // Mock components for the invalid upload workflow tests
  const MockUploadDropzone = ({
    onFileAccepted,
    onUploadError,
    validateFile,
  }: {
    onFileAccepted?: (file: File) => void;
    onUploadError?: (error: string) => void;
    validateFile: (file: File) => { valid: boolean; error: string | null };
  }) => {
    const [error, setError] = React.useState<string | null>(null);
    const [dragActive, setDragActive] = React.useState(false);

    const handleFile = (file: File) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error);
        onUploadError?.(validation.error || 'Invalid file');
      } else {
        setError(null);
        onFileAccepted?.(file);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    };

    return (
      <div
        data-testid="upload-dropzone"
        data-drag-active={dragActive}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
      >
        <input
          type="file"
          data-testid="file-input"
          onChange={handleChange}
          accept="image/jpeg,image/png,image/webp"
        />
        <p>Drop an image or click to upload</p>
        {error && (
          <div role="alert" data-testid="upload-error" data-error-type={error.includes('size') ? 'size' : error.includes('format') ? 'format' : 'generic'}>
            {error}
          </div>
        )}
      </div>
    );
  };

  const validFileValidator = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return { valid: false, error: `Invalid format. Accepted: jpg, png, or webp` };
    }
    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds 10MB limit` };
    }
    return { valid: true, error: null };
  };

  it('rejects unsupported file types with accessible error message', async () => {
    const onUploadComplete = vi.fn();
    const onUploadError = vi.fn();

    render(
      <MockUploadDropzone
        validateFile={validFileValidator}
        onFileAccepted={onUploadComplete}
        onUploadError={onUploadError}
      />
    );

    const file = createMockFile({ name: 'document.txt', type: 'text/plain' });
    const fileInput = screen.getByTestId('file-input');

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // Verify error is displayed
    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toBeTruthy();
    expect(errorAlert.textContent).toMatch(/jpg, png, or webp/i);

    // Verify callback was called with error
    expect(onUploadError).toHaveBeenCalledTimes(1);
    expect(onUploadError).toHaveBeenCalledWith(expect.stringMatching(/jpg, png, or webp/i));

    // Verify success callback was NOT called
    expect(onUploadComplete).not.toHaveBeenCalled();
  });

  it('rejects oversized files with accessible error message', async () => {
    const onUploadComplete = vi.fn();
    const onUploadError = vi.fn();

    render(
      <MockUploadDropzone
        validateFile={validFileValidator}
        onFileAccepted={onUploadComplete}
        onUploadError={onUploadError}
      />
    );

    // Create file larger than 10MB
    const file = createMockFile({ name: 'large-image.jpg', type: 'image/jpeg', size: 15 * 1024 * 1024 });
    const fileInput = screen.getByTestId('file-input');

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // Verify error is displayed
    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toBeTruthy();
    expect(errorAlert.textContent).toMatch(/size exceeds/i);

    // Verify error has correct data attribute for testing
    expect(errorAlert.getAttribute('data-error-type')).toBe('size');
  });

  it('rejects empty files', async () => {
    const validatorWithEmptyCheck = (file: File) => {
      if (file.size === 0) {
        return { valid: false, error: 'File is empty' };
      }
      return { valid: true, error: null };
    };

    const onUploadError = vi.fn();

    render(
      <MockUploadDropzone
        validateFile={validatorWithEmptyCheck}
        onUploadError={onUploadError}
      />
    );

    const file = new File([], 'empty.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByTestId('file-input');

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(onUploadError).toHaveBeenCalledWith('File is empty');
    });
  });

  it('rejects files via drag and drop', async () => {
    const onUploadComplete = vi.fn();

    render(
      <MockUploadDropzone
        validateFile={validFileValidator}
        onFileAccepted={onUploadComplete}
      />
    );

    const dropzone = screen.getByTestId('upload-dropzone');
    const file = createMockFile({ name: 'script.exe', type: 'application/exe' });

    await act(async () => {
      const dataTransfer = { files: [file] };

      fireEvent.drop(dropzone, { dataTransfer });
    });

    // Verify error is shown
    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toBeTruthy();

    // Verify no asset was stored
    expect(onUploadComplete).not.toHaveBeenCalled();
  });

  it('clears error when new valid file is uploaded', async () => {

    render(
      <MockUploadDropzone
        validateFile={validFileValidator}
      />
    );

    const fileInput = screen.getByTestId('file-input');

    // First, upload invalid file
    const invalidFile = createMockFile({ name: 'badfile.txt', type: 'text/plain' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
    });

    // Now upload valid file - error should be cleared
    const validFile = createMockFile({ name: 'goodfile.jpg', type: 'image/jpeg' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    });

    // Error should be gone
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('provides descriptive aria-live region for screen readers', async () => {

    const MockAccessibilityDropzone = () => {
      const [error, setError] = React.useState<string | null>(null);

      React.useEffect(() => {
        if (error) {
          const announce = document.createElement('div');
          announce.setAttribute('role', 'status');
          announce.setAttribute('aria-live', 'polite');
          announce.setAttribute('aria-atomic', 'true');
          announce.textContent = `Upload failed: ${error}`;
          announce.id = 'upload-announcement';
          document.body.appendChild(announce);
          return () => document.body.removeChild(announce);
        }
      }, [error]);

      return (
        <div data-testid="upload-dropzone">
          <input
            type="file"
            data-testid="file-input"
            aria-label="Upload passport photo"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && file.type === 'text/plain') {
                setError('Invalid file format. Only images are accepted.');
              }
            }}
            accept="image/jpeg,image/png"
          />
        </div>
      );
    };

    render(<MockAccessibilityDropzone />);

    const file = createMockFile({ name: 'not-an-image.txt', type: 'text/plain' });
    const fileInput = screen.getByTestId('file-input');

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      const announcement = document.getElementById('upload-announcement');
      expect(announcement).toBeTruthy();
      expect(announcement?.textContent).toContain('Upload failed');
    });
  });

  it('verifies no blob URL or object URL is created for invalid files', async () => {
    const objectURLSpy = vi.spyOn(URL, 'createObjectURL');

    render(
      <MockUploadDropzone
        validateFile={validFileValidator}
      />
    );

    const file = createMockFile({ name: 'badfile.exe', type: 'application/exe' });
    const fileInput = screen.getByTestId('file-input');

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // createObjectURL should NOT have been called for invalid files
    expect(objectURLSpy).not.toHaveBeenCalled();

    objectURLSpy.mockRestore();
  });
});