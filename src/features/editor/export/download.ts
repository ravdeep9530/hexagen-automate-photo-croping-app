import type { ExportFormat } from '@/domain/export';

export interface DownloadTriggerOptions {
  blob: Blob;
  filename: string;
  format: ExportFormat;
  revokeAfterMs?: number;
}

export interface DownloadTriggerResult {
  url: string;
  filename: string;
  format: ExportFormat;
}

let pendingRevokes: Map<string, number> = new Map();

function scheduleRevoke(url: string, delay: number = 5_000): void {
  if (pendingRevokes.has(url)) return;
  const timerId = window.setTimeout(() => {
    URL.revokeObjectURL(url);
    pendingRevokes.delete(url);
  }, delay);
  pendingRevokes.set(url, timerId);
}

export function triggerDownload(options: DownloadTriggerOptions): DownloadTriggerResult {
  const url = URL.createObjectURL(options.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = options.filename;
  anchor.style.setProperty('display', 'none');
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  scheduleRevoke(url, options.revokeAfterMs ?? 5_000);
  return { url, filename: options.filename, format: options.format };
}

export function revokeImmediate(url: string): void {
  const timerId = pendingRevokes.get(url);
  if (timerId) {
    window.clearTimeout(timerId);
    pendingRevokes.delete(url);
  }
  URL.revokeObjectURL(url);
}

export function getPendingUrlsCount(): number {
  return pendingRevokes.size;
}
