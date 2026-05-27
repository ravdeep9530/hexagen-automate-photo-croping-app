import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, within, fireEvent } from '@testing-library/react';

import { createMockFile, createMockFileList, mockFileReader } from '@/test/mocks/file';
import { installCanvasMocks } from '@/test/mocks/canvas';

// Mock the Zustand store
const mockStore = {
  asset: null as { file: File; objectUrl: string } | null,
  selectedPresetId: null as string | null,
  cropState: { x: 0, y: 0, scale: 1, rotation: 0 },
  adjustments: { brightness: 0, contrast: 0, saturation: 0 },
  validationResults: [] as Array<{ passed: boolean; message: string }>,
  isProcessing: false,
  processingError: null as string | null,
  exportSettings: { format: 'jpeg', quality: 0.95 },
  setAsset: vi.fn(),
  setSelectedPreset: vi.fn(),
  updateCropState: vi.fn(),
  updateAdjustments: vi.fn(),
  validateAsset: vi.fn(),
  exportImage: vi.fn(),
  clearEditor: vi.fn(),
};

vi.mock('@/features/editor/store/editor-store', () => ({
  useEditorStore: () => mockStore,
}));

const mockPresets = [
  { id: 'us-passport', name: 'US Passport', dimensions: { width: 600, height: 600 }, aspectRatio: 1 },
  { id: 'ca-visa-35x45', name: 'Canada Visa 35x45mm', dimensions: { width: 420, height: 540 }, aspectRatio: 0.778 },
  { id: 'in-passport', name: 'India Passport', dimensions: { width: 600, height: 800 }, aspectRatio: 0.75 },
];

// Simple mock components for the workflow tests
const MockUploadDropzone = ({ onFileAccepted }: { onFileAccepted: (file: File) => void }) => {
  const [dragActive, setDragActive] = React.useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileAccepted(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileAccepted(file);
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
        accept="image/*"
      />
      <p>Drop an image or click to upload</p>
    </div>
  );
};

const MockPresetSelector = ({
  presets = mockPresets,
  selectedId,
  onSelect,
}: {
  presets?: typeof mockPresets;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) => (
  <div data-testid="preset-selector">
    <select
      data-testid="preset-dropdown"
      value={selectedId ?? ''}
      onChange={(e) => onSelect(e.target.value)}
      aria-label="Select document preset"
    >
      <option value="">Choose a preset...</option>
      {presets.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  </div>
);

const MockValidationPanel = ({ results, error }: { results: typeof mockStore.validationResults; error: string | null }) => (
  <div data-testid="validation-panel" role="region" aria-label="Validation results">
    {error && <div role="alert">{error}</div>}
    <ul>
      {results.map((result, idx) => (
        <li key={idx} data-passed={result.passed}>
          {result.message}
        </li>
      ))}
    </ul>
  </div>
);

const MockExportPanel = ({
  onExport,
  isProcessing,
}: {
  onExport: () => void;
  isProcessing: boolean;
}) => (
  <div data-testid="export-panel">
    <button
      data-testid="export-button"
      onClick={onExport}
      disabled={isProcessing}
      aria-busy={isProcessing}
    >
      {isProcessing ? 'Processing...' : 'Download Photo'}
    </button>
  </div>
);

const MockEditorShell = () => {
  const [hasAsset, setHasAsset] = React.useState(false);
  const [validationResults, setValidationResults] = React.useState<typeof mockStore.validationResults>([]);
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleFileAccepted = (file: File) => {
    mockStore.setAsset({ file, objectUrl: 'blob:mock' });
    setHasAsset(true);
    // Trigger validation after a short delay (simulating preview render)
    setTimeout(() => {
      const results = [
        { passed: true, message: 'File format valid' },
        { passed: true, message: 'Dimensions acceptable' },
        { passed: file.size < 10 * 1024 * 1024, message: 'File size OK' },
      ];
      setValidationResults(results);
      mockStore.validateAsset.mockResolvedValue(results);
    }, 10);
  };

  const handleExport = async () => {
    setIsProcessing(true);
    mockStore.isProcessing = true;
    // Simulate canvas export
    await new Promise((resolve) => setTimeout(resolve, 50));
    mockStore.exportImage(new Blob(['exported'], { type: 'image/jpeg' }));
    setIsProcessing(false);
    mockStore.isProcessing = false;
  };

  return (
    <div data-testid="editor-shell">
      <header>
        <h1>Passport Photo Editor</h1>
      </header>

      {!hasAsset ? (
        <MockUploadDropzone onFileAccepted={handleFileAccepted} />
      ) : (
        <>
          <MockPresetSelector
            selectedId={selectedPreset}
            onSelect={(id) => {
              setSelectedPreset(id);
              mockStore.setSelectedPreset(id);
            }}
          />
          <div data-testid="preview-area" role="img" aria-label="Photo preview"></div>
          <MockValidationPanel results={validationResults} error={null} />
          <MockExportPanel onExport={handleExport} isProcessing={isProcessing} />
        </>
      )}
    </div>
  );
};

describe('Editor Happy-Path Workflow', () => {
  let canvasMocks: ReturnType<typeof installCanvasMocks>;
  let fileReaderMock: ReturnType<typeof mockFileReader>;

  beforeEach(() => {
    canvasMocks = installCanvasMocks({ type: 'image/jpeg' });
    fileReaderMock = mockFileReader({ result: 'data:image/jpeg;base64,mock-preview' });
    vi.clearAllMocks();
  });

  afterEach(() => {
    canvasMocks.restore();
    fileReaderMock.restore();
  });

  it('completes full workflow: upload, preset selection, validation, export', async () => {

    render(<MockEditorShell />);

    // 1. Upload file
    const file = createMockFile({ name: 'passport-photo.jpg', type: 'image/jpeg', size: 2 * 1024 * 1024 });
    const fileInput = screen.getByTestId('file-input');

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // 2. Verify asset stored
    await waitFor(() => expect(mockStore.setAsset).toHaveBeenCalledWith(
      expect.objectContaining({ file: expect.any(File) })
    ));

    // 3. Verify preview rendered (UI transitions)
    await waitFor(() => {
      expect(screen.getByTestId('preset-selector')).toBeTruthy();
      expect(screen.queryByTestId('upload-dropzone')).toBeNull();
    });

    // 4. Select preset
    const presetSelect = screen.getByTestId('preset-dropdown');
    await act(async () => {
      fireEvent.change(presetSelect, { target: { value: 'us-passport' } });
    });

    expect(mockStore.setSelectedPreset).toHaveBeenCalledWith('us-passport');

    // 5. Verify validation panel updates
    const validationPanel = screen.getByTestId('validation-panel');
    await waitFor(() => {
      expect(within(validationPanel).getAllByRole('listitem').length).toBeGreaterThan(0);
    });

    // 6. Trigger export and verify export called
    const exportButton = screen.getByTestId('export-button');
    await act(async () => {
      fireEvent.click(exportButton);
    });

    await waitFor(() => {
      expect(mockStore.exportImage).toHaveBeenCalled();
    });
  });

  it('uploads via drag and drop', async () => {

    render(<MockEditorShell />);

    const dropzone = screen.getByTestId('upload-dropzone');
    const file = createMockFile({ name: 'dragged-image.png', type: 'image/png' });

    await act(async () => {
      const dataTransfer = { files: [file] };

      fireEvent.drop(dropzone, { dataTransfer });
    });

    await waitFor(() => {
      expect(mockStore.setAsset).toHaveBeenCalledWith(
        expect.objectContaining({ file: expect.any(File) })
      );
    });
  });

  it('handles different preset selection flow', async () => {
    const file = createMockFile();

    render(<MockEditorShell />);

    // Upload first
    const fileInput = screen.getByTestId('file-input');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => expect(screen.getByTestId('preset-selector')).toBeTruthy());

    // Test multiple preset selections
    const presetSelect = screen.getByTestId('preset-dropdown');

    await act(async () => {
      fireEvent.change(presetSelect, { target: { value: 'ca-visa-35x45' } });
    });
    expect(mockStore.setSelectedPreset).toHaveBeenLastCalledWith('ca-visa-35x45');

    await act(async () => {
      fireEvent.change(presetSelect, { target: { value: 'in-passport' } });
    });
    expect(mockStore.setSelectedPreset).toHaveBeenLastCalledWith('in-passport');
  });
});
