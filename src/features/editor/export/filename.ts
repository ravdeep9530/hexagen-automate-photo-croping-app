import type { SupportedExportFormat } from './export-renderer';

export interface ExportFilenameOptions {
  baseName?: string;
  presetName?: string;
  mode?: 'single' | 'sheet-4x6';
  format: SupportedExportFormat;
  now?: Date;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function extensionFor(format: SupportedExportFormat): string {
  return format === 'jpeg' ? 'jpg' : 'png';
}

export function generateExportFilename(options: ExportFilenameOptions): string {
  const date = (options.now ?? new Date()).toISOString().slice(0, 10);
  const base = slugify(options.baseName || 'passport-photo') || 'passport-photo';
  const preset = options.presetName ? slugify(options.presetName) : undefined;
  const mode = options.mode === 'sheet-4x6' ? '4x6-sheet' : 'single';
  const parts = [base, preset, mode, date].filter(Boolean);
  return `${parts.join('-')}.${extensionFor(options.format)}`;
}
