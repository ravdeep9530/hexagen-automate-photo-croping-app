import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ExportPanel } from '../export-panel';

const store: Partial<Record<string, unknown>> = {
  asset: { id: 'a1', blobUrl: 'blob:a1', metadata: { width: 1000, height: 1200 } },
  cropState: { x: 0, y: 0, width: 1000, height: 1200, rotation: 0, scale: 1 },
  processingSettings: { brightness: 0, contrast: 0, saturation: 0, sharpness: 0, background: { mode: 'original' } },
  exportSettings: { widthPx: 600, heightPx: 800 },
  selectedPreset: { id: 'preset-1', name: 'Passport Example' },
  runtime: { isAssetLoading: false, isProcessing: false, isExporting: false, processingProgress: 0, exportProgress: 0 },
  validationIssues: [],
  setIsExporting: vi.fn(),
  setExportProgress: vi.fn(),
  setExportAbortController: vi.fn(),
};

vi.mock('../../store/editor-store', () => ({
  useEditorStore: () => store,
  canExport: () => true,
}));

const createObjectURLMock = vi.fn().mockReturnValue('blob:redirect');
const revokeObjectURLMock = vi.fn();

vi.mock('../../export/export-renderer', () => ({
  renderExport: vi.fn(async () => ({
    blob: new Blob(['bytes'], { type: 'image/jpeg' }),
    canvas: { width: 600, height: 800 },
    width: 600,
    height: 800,
    mimeType: 'image/jpeg',
    warnings: [],
  })),
}));

describe('ExportPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders export controls', () => {
    render(<ExportPanel />);
    expect(screen.getByLabelText(/export mode/i)).toBeTruthy();
    expect(screen.getByLabelText(/export format/i)).toBeTruthy();
    expect(screen.getByLabelText(/jpeg quality/i)).toBeTruthy();
  });

  it('defaults to single photo mode', () => {
    render(<ExportPanel />);
    const modeSelect = screen.getByLabelText(/export mode/i) as HTMLSelectElement;
    expect(modeSelect.value).toBe('single');
  });

  it('shows format selection with PNG and JPEG options', () => {
    render(<ExportPanel />);
    const selectEl = screen.getByLabelText(/export format/i) as HTMLSelectElement;
    expect(selectEl.value).toBe('jpeg');
    expect(screen.getByRole('option', { name: /JPEG/i })).toBeTruthy();
    expect(screen.getByRole('option', { name: /PNG/i })).toBeTruthy();
  });

  it('toggles 4x6 mode displays copies, cut lines, and labels', () => {
    render(<ExportPanel />);
    fireEvent.change(screen.getByLabelText(/export mode/i), { target: { value: 'sheet-4x6' } });

    expect(screen.getByLabelText(/copies/i)).toBeTruthy();
    expect(screen.getByLabelText(/cut lines/i)).toBeTruthy();
    expect(screen.getByLabelText(/labels/i)).toBeTruthy();
  });

  it('disables quality slider for PNG', async () => {
    render(<ExportPanel />);
    const qualityInput = screen.getByLabelText(/jpeg quality/i) as HTMLInputElement;

    fireEvent.change(screen.getByLabelText(/export format/i), { target: { value: 'png' } });

    await waitFor(() => {
      expect(qualityInput.disabled).toBe(true);
    });
  });
});
