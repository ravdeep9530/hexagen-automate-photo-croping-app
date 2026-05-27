'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { generateExportFilename } from '../export/filename';
import { renderExport, type ExportMode, type SupportedExportFormat } from '../export/export-renderer';
import { triggerDownload } from '../export/download';
import { useEditorStore, canExport } from '../store/editor-store';

const DEFAULT_COPIES = 4;

function clampQuality(value: number): number {
  if (Number.isNaN(value)) return 0.92;
  return Math.max(0.1, Math.min(1, value));
}

export function ExportPanel(): JSX.Element {
  const editor = useEditorStore();
  const [mode, setMode] = React.useState<ExportMode>('single');
  const [format, setFormat] = React.useState<SupportedExportFormat>('jpeg');
  const [jpegQuality, setJpegQuality] = React.useState(0.92);
  const [copies, setCopies] = React.useState(DEFAULT_COPIES);
  const [includeCutLines, setIncludeCutLines] = React.useState(true);
  const [includeLabels, setIncludeLabels] = React.useState(false);
  const [status, setStatus] = React.useState<string>('');
  const [warnings, setWarnings] = React.useState<string[]>([]);

  const settings = editor.exportSettings;
  const widthPx = settings?.widthPx ?? editor.selectedPreset?.dimensions.widthPx ?? 600;
  const heightPx = settings?.heightPx ?? editor.selectedPreset?.dimensions.heightPx ?? 800;
  const disabled = !canExport(editor) || editor.runtime.isExporting;

  async function onDownload(): Promise<void> {
    if (!editor.asset || !editor.cropState) {
      setStatus('Upload and crop a photo before exporting.');
      return;
    }

    const controller = new AbortController();
    editor.setExportAbortController(controller);
    editor.setIsExporting(true);
    editor.setExportProgress(0.1);
    setWarnings([]);
    setStatus('Rendering export…');

    try {
      const result = await renderExport({
        asset: editor.asset,
        crop: editor.cropState,
        processing: editor.processingSettings,
        mode,
        format,
        widthPx,
        heightPx,
        jpegQuality,
        copies,
        includeCutLines,
        includeLabels,
        label: editor.selectedPreset?.name ?? 'Passport photo',
        signal: controller.signal,
      });
      editor.setExportProgress(0.8);
      const filename = generateExportFilename({
        baseName: settings?.filename ?? editor.selectedPreset?.id ?? 'passport-photo',
        presetName: editor.selectedPreset?.name,
        mode,
        format,
      });
      triggerDownload({ blob: result.blob, filename, format });
      setWarnings(result.warnings.map((warning) => warning.message));
      setStatus(`Downloaded ${filename}`);
      editor.setExportProgress(1);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Export failed.');
    } finally {
      editor.setIsExporting(false);
      editor.setExportAbortController(undefined);
    }
  }

  return (
    <Card className="space-y-4 p-4" data-testid="export-panel">
      <div>
        <h3 className="text-sm font-semibold">Download</h3>
        <p className="text-xs text-muted-foreground">Render a privacy-safe browser export from your local photo.</p>
      </div>

      <label className="block text-sm font-medium">
        Mode
        <select
          aria-label="Export mode"
          className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
          value={mode}
          onChange={(event) => setMode(event.target.value as ExportMode)}
        >
          <option value="single">Single photo</option>
          <option value="sheet-4x6">Printable 4x6 sheet</option>
        </select>
      </label>

      <label className="block text-sm font-medium">
        Format
        <select
          aria-label="Export format"
          className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
          value={format}
          onChange={(event) => setFormat(event.target.value as SupportedExportFormat)}
        >
          <option value="jpeg">JPEG</option>
          <option value="png">PNG</option>
        </select>
      </label>

      <label className="block text-sm font-medium">
        JPEG quality
        <input
          aria-label="JPEG quality"
          className="mt-1 w-full"
          type="range"
          min="0.1"
          max="1"
          step="0.01"
          value={jpegQuality}
          disabled={format !== 'jpeg'}
          onChange={(event) => setJpegQuality(clampQuality(Number(event.target.value)))}
        />
        <span className="text-xs text-muted-foreground">{Math.round(jpegQuality * 100)}%</span>
      </label>

      {mode === 'sheet-4x6' && (
        <div className="space-y-3 rounded-md border p-3">
          <label className="block text-sm font-medium">
            Copies
            <input
              aria-label="Copies"
              className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
              type="number"
              min="1"
              max="24"
              value={copies}
              onChange={(event) => setCopies(Math.max(1, Math.min(24, Number(event.target.value) || 1)))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              aria-label="Cut lines"
              type="checkbox"
              checked={includeCutLines}
              onChange={(event) => setIncludeCutLines(event.target.checked)}
            />
            Include cut lines
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              aria-label="Labels"
              type="checkbox"
              checked={includeLabels}
              onChange={(event) => setIncludeLabels(event.target.checked)}
            />
            Include preset label
          </label>
        </div>
      )}

      <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
        Output: {mode === 'sheet-4x6' ? '1800 × 1200 px at 300 DPI pixels' : `${widthPx} × ${heightPx} px`}
      </div>

      {warnings.length > 0 && (
        <ul className="space-y-1 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900" aria-label="Export warnings">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      {status && <p className="text-xs text-muted-foreground" role="status">{status}</p>}

      <Button type="button" className="w-full" disabled={disabled} onClick={onDownload}>
        {editor.runtime.isExporting ? 'Exporting…' : 'Download export'}
      </Button>
    </Card>
  );
}
